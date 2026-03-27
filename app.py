import os, re, base64, pickle, json
from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
from googleapiclient.discovery import build
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from email.header import decode_header as dh
import dateparser
from datetime import datetime

# Configure Flask to serve the React build
app = Flask(__name__, static_folder='hackradar-ui/build', static_url_path='')
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
    
    # Check for GOOGLE_TOKEN_PICKLE in environment variables (Base64 encoded)
    env_token = os.getenv('GOOGLE_TOKEN_PICKLE')
    if env_token:
        try:
            creds = pickle.loads(base64.b64decode(env_token))
        except Exception as e:
            print(f"Error loading GOOGLE_TOKEN_PICKLE: {e}")

    # Fallback to token.pickle file
    if not creds and os.path.exists('token.pickle'):
        with open('token.pickle', 'rb') as f:
            creds = pickle.load(f)

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            # Load credentials from environment variable if available
            env_creds = os.getenv('GOOGLE_CREDENTIALS_JSON')
            cred_file = 'credentials.json'
            
            if env_creds:
                with open(cred_file, 'w') as f:
                f.write(base64.b64decode(env_creds).decode())
            
            if not os.path.exists(cred_file):
                raise Exception("Missing credentials.json and GOOGLE_CREDENTIALS_JSON env var")

            flow = InstalledAppFlow.from_client_secrets_file(cred_file, SCOPES)
            creds = flow.run_local_server(port=0)

        # Save the credentials for the next run (locally)
        with open('token.pickle', 'wb') as f:
            pickle.dump(creds, f)
        # Log re-encoded token so it can be updated in env vars on Render
        print("UPDATED TOKEN (re-paste into GOOGLE_TOKEN_PICKLE env var):")
        print(base64.b64encode(pickle.dumps(creds)).decode())
            
    return build('gmail', 'v1', credentials=creds)

def decode_str(s):
    if not s: return ''
    decoded, enc = dh(s)[0]
    if isinstance(decoded, bytes):
        return decoded.decode(enc or 'utf-8', errors='ignore')
    return decoded or ''

def get_body(payload):
    text_parts = []
    html_parts = []

    def parse_parts(parts):
        for part in parts:
            if part['mimeType'] == 'text/plain':
                data = part['body'].get('data', '')
                if data:
                    text_parts.append(base64.urlsafe_b64decode(data).decode('utf-8', errors='ignore'))
            elif part['mimeType'] == 'text/html':
                data = part['body'].get('data', '')
                if data:
                    html_parts.append(base64.urlsafe_b64decode(data).decode('utf-8', errors='ignore'))
            elif 'parts' in part:
                parse_parts(part['parts'])

    if 'parts' in payload:
        parse_parts(payload['parts'])
    else:
        # Fallback if there are no parts
        mime_type = payload.get('mimeType', 'text/plain')
        data = payload.get('body', {}).get('data', '')
        if data:
            decoded = base64.urlsafe_b64decode(data).decode('utf-8', errors='ignore')
            if mime_type == 'text/html':
                html_parts.append(decoded)
            else:
                text_parts.append(decoded)
                
    text_content = "\n".join(text_parts)
    html_content = "\n".join(html_parts)
    return text_content, html_content

def extract_deadline(text):
    patterns = [
        r'(?:deadline|last date|due|closes?|ends?|submit by)[:\s]+([A-Z][a-z]+ \d{1,2}(?:,?\s*\d{4})?)',
        r'(?:deadline|last date|due)[:\s]+(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})',
        r'(?:before|by)\s+([A-Z][a-z]+ \d{1,2}(?:,?\s*\d{4})?)',
    ]
    for p in patterns:
        m = re.search(p, text, re.IGNORECASE)
        if m:
            parsed = dateparser.parse(m.group(1))
            if parsed:
                return parsed.strftime('%d %b %Y')
            return m.group(1)
    return None

def get_status(tags, deadline):
    if deadline:
        try:
            d = datetime.strptime(deadline, '%d %b %Y')
            days_left = (d - datetime.now()).days
            if days_left < 0:
                return 'new'
            if days_left <= 3:
                return 'urgent'
            return 'upcoming'
        except ValueError:
            pass
    if any(t in tags for t in ['deadline', 'submit project']):
        return 'urgent'
    return 'new'

@app.route('/api/emails')
def get_emails():
    try:
        service = authenticate()
        base_query = ' OR '.join([f'"{kw}"' for kw in KEYWORDS])
        query = f'({base_query}) -to:atharv.namdeo2025@vitstudent.ac.in'
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
            body_text, body_html = get_body(full['payload'])
            subject = decode_str(headers.get('Subject', 'No Subject'))
            matched_tags = [kw for kw in KEYWORDS if kw.lower() in (subject + body_text).lower()]
            deadline = extract_deadline(body_text)

            emails.append({
                'id': msg['id'],
                'subject': subject,
                'from': decode_str(headers.get('From', '')),
                'date': headers.get('Date', ''),
                'snippet': full.get('snippet', ''),
                'body_preview': body_text[:300].strip(),
                'body_text': body_text.strip(),
                'body_html': body_html.strip(),
                'deadline': deadline,
                'tags': matched_tags[:5],
                'status': get_status(matched_tags, deadline),
            })

        order = {'urgent': 0, 'upcoming': 1, 'new': 2}
        emails.sort(key=lambda x: order.get(x['status'], 3))
        return jsonify(emails)

    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Serve React App
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path != "" and os.path.exists(app.static_folder + '/' + path):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f"🚀 HackRadar backend starting on port {port}...")
    app.run(host='0.0.0.0', port=port, debug=False)
