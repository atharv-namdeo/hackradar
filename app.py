import os, re, base64, pickle
from flask import Flask, jsonify
from flask_cors import CORS
from googleapiclient.discovery import build
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from email.header import decode_header as dh
import dateparser

app = Flask(__name__)
CORS(app)

SCOPES = ['https://www.googleapis.com/auth/gmail.readonly']

KEYWORDS = [
    'hackathon', 'hack', 'devpost', 'competition', 'contest',
    'challenge', 'ideathon', 'datathon', 'buildathon',
    'smart india', 'SIH', 'MLH', 'IEEE', 'ACM',
    'register now', 'deadline', 'submit project'
]

def authenticate():
    creds = None
    if os.path.exists('token.pickle'):
        with open('token.pickle', 'rb') as f:
            creds = pickle.load(f)
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file('credentials.json', SCOPES)
            creds = flow.run_local_server(port=0)
        with open('token.pickle', 'wb') as f:
            pickle.dump(creds, f)
    return build('gmail', 'v1', credentials=creds)

def decode_str(s):
    if not s: return ''
    decoded, enc = dh(s)[0]
    if isinstance(decoded, bytes):
        return decoded.decode(enc or 'utf-8', errors='ignore')
    return decoded or ''

def get_body(payload):
    if 'parts' in payload:
        for part in payload['parts']:
            if part['mimeType'] == 'text/plain':
                data = part['body'].get('data', '')
                if data:
                    return base64.urlsafe_b64decode(data).decode('utf-8', errors='ignore')
    data = payload.get('body', {}).get('data', '')
    if data:
        return base64.urlsafe_b64decode(data).decode('utf-8', errors='ignore')
    return ''

def extract_deadline(text):
    patterns = [
        r'(?:deadline|last date|due|closes?|ends?|submit by|before|by)[:\s]+(.{5,40}?)(?:\n|\.)',
    ]
    for p in patterns:
        m = re.search(p, text, re.IGNORECASE)
        if m:
            parsed = dateparser.parse(m.group(1))
            if parsed:
                return parsed.strftime('%d %b %Y')
    return None

def get_status(tags, deadline):
    if any(t in tags for t in ['deadline', 'submit project']):
        return 'urgent'
    if deadline: return 'upcoming'
    return 'new'

@app.route('/api/emails')
def get_emails():
    try:
        service = authenticate()
        query = ' OR '.join([f'"{kw}"' for kw in KEYWORDS])
        result = service.users().messages().list(
            userId='me', q=query, maxResults=50
        ).execute()
        messages = result.get('messages', [])

        emails = []
        for msg in messages:
            full = service.users().messages().get(
                userId='me', id=msg['id'], format='full'
            ).execute()
            headers = {h['name']: h['value'] for h in full['payload']['headers']}
            body = get_body(full['payload'])
            subject = decode_str(headers.get('Subject', 'No Subject'))
            matched_tags = [kw for kw in KEYWORDS if kw.lower() in (subject + body).lower()]
            deadline = extract_deadline(body)

            emails.append({
                'id': msg['id'],
                'subject': subject,
                'from': decode_str(headers.get('From', '')),
                'date': headers.get('Date', ''),
                'snippet': full.get('snippet', ''),
                'body_preview': body[:300].strip(),
                'body_full': body.strip(),
                'deadline': deadline,
                'tags': matched_tags[:5],
                'status': get_status(matched_tags, deadline),
            })

        emails.sort(key=lambda x: x['status'] != 'urgent')
        return jsonify(emails)

    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print("🚀 HackRadar backend starting...")
    print("📬 Opening browser for Google login on first run...")
    app.run(port=5000, debug=True)
