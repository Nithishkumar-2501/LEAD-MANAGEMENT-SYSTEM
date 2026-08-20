"""
Antigravity College Admission CRM - Gmail API Mailer
---------------------------------------------------
This script authenticates with Gmail using OAuth 2.0 and sends personalized
admission update emails using the official google-auth and google-api-python-client libraries.
"""

import os
import base64
from email.message import EmailMessage
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

# If modifying these scopes, delete the file token.json.
SCOPES = ['https://www.googleapis.com/auth/gmail.send']

def authenticate_gmail():
    """
    Authenticates the user via OAuth 2.0 and returns the Gmail API service object.
    
    - Checks for existing valid token in token.json.
    - If expired, refreshes using the refresh token.
    - If missing or invalid, prompts local OAuth login via credentials.json.
    """
    creds = None
    
    # The file token.json stores the user's access and refresh tokens
    if os.path.exists('token.json'):
        creds = Credentials.from_authorized_user_file('token.json', SCOPES)
        
    # If there are no valid credentials available, let the user log in.
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            print("Access token expired. Refreshing token...")
            creds.refresh(Request())
        else:
            if not os.path.exists('credentials.json'):
                raise FileNotFoundError(
                    "Missing 'credentials.json'. Download OAuth 2.0 Client Credentials from Google Cloud Console."
                )
            print("Initiating OAuth 2.0 flow...")
            flow = InstalledAppFlow.from_client_secrets_file('credentials.json', SCOPES)
            creds = flow.run_local_server(port=0)
            
        # Save credentials for future executions
        with open('token.json', 'w') as token:
            token.write(creds.to_json())
            print("Credentials stored successfully in 'token.json'.")

    return build('gmail', 'v1', credentials=creds)


def create_message(sender: str, to: str, subject: str, body_text: str, body_html: str = None) -> dict:
    """
    Creates a MIME email message and encodes it in URL-safe base64 format for the Gmail API.
    """
    message = EmailMessage()
    message['To'] = to
    message['From'] = sender
    message['Subject'] = subject
    
    # Set plain text fallback
    message.set_content(body_text)
    
    # Add HTML alternative if provided
    if body_html:
        message.add_alternative(body_html, subtype='html')

    # Encode message bytes to base64url safe string as required by Gmail API
    raw_bytes = message.as_bytes()
    encoded_message = base64.urlsafe_b64encode(raw_bytes).decode('utf-8')
    
    return {'raw': encoded_message}


def send_email(service, user_id: str, message: dict):
    """
    Dispatches email directly using users().messages().send()
    """
    try:
        sent_message = service.users().messages().send(
            userId=user_id,
            body=message
        ).execute()
        print(f"✅ Email sent successfully! Gmail Message ID: {sent_message['id']}")
        return sent_message
    except HttpError as error:
        print(f"❌ An error occurred while sending email: {error}")
        return None


def send_admission_update(service, applicant_name: str, applicant_email: str, application_id: str, status: str, details: str):
    """
    Sends a formatted, personalized admission update email to an applicant.
    """
    subject = f"Antigravity College Admission Update - Application #{application_id}"
    
    body_text = f"""Dear {applicant_name},

Thank you for applying to Antigravity College.

We are writing to provide an update regarding your application (ID: {application_id}).

Current Status: {status}

Decision / Next Steps:
{details}

If you have any questions, please log into your Admissions Portal or reply to this email.

Best regards,
Office of Admissions
Antigravity College
"""

    body_html = f"""
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
      </head>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; padding: 20px; color: #1e293b;">
        <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
          <div style="background: linear-gradient(135deg, #4f46e5, #06b6d4); padding: 24px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 600;">Antigravity College</h1>
            <p style="color: #e0e7ff; margin: 4px 0 0 0; font-size: 14px;">Office of Admissions</p>
          </div>
          
          <div style="padding: 28px;">
            <p style="font-size: 16px;">Dear <strong>{applicant_name}</strong>,</p>
            <p style="line-height: 1.6; color: #475569;">Thank you for applying to Antigravity College. We are pleased to provide an update on your application status.</p>
            
            <div style="background-color: #f1f5f9; border-left: 4px solid #4f46e5; padding: 16px; border-radius: 4px; margin: 20px 0;">
              <p style="margin: 0; font-size: 14px; color: #64748b;">Application ID: <strong>{application_id}</strong></p>
              <p style="margin: 6px 0 0 0; font-size: 16px; color: #0f172a;">Status: <span style="color: #2563eb; font-weight: 600;">{status}</span></p>
            </div>
            
            <div style="line-height: 1.6; color: #334155; margin-bottom: 24px;">
              {details}
            </div>
            
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
            <p style="font-size: 13px; color: #94a3b8; margin: 0; text-align: center;">
              This email was sent directly from Antigravity College Admission CRM.<br>
              If you have any questions, please contact our support team.
            </p>
          </div>
        </div>
      </body>
    </html>
    """

    raw_msg = create_message(
        sender="me",
        to=applicant_email,
        subject=subject,
        body_text=body_text,
        body_html=body_html
    )

    return send_email(service, user_id='me', message=raw_msg)


if __name__ == '__main__':
    print("=== Antigravity College Admission CRM - Gmail Sender ===")
    
    # Step 1: Authenticate with Gmail API
    service = authenticate_gmail()

    # Step 2: Sample Personalized Admission Email Data
    sample_applicant = {
        "applicant_name": "Alex Mercer",
        "applicant_email": "alex.mercer@example.com",
        "application_id": "ADM-2026-8942",
        "status": "Accepted",
        "details": "<p>Congratulations! We are thrilled to inform you that you have been <strong>accepted</strong> into the Computer Science Program for the Fall 2026 term.</p><p>Please complete your enrollment confirmation by <strong>May 15, 2026</strong> in your portal.</p>"
    }

    # Step 3: Send personalized update
    print(f"\nSending admission update to {sample_applicant['applicant_email']}...")
    send_admission_update(
        service=service,
        applicant_name=sample_applicant['applicant_name'],
        applicant_email=sample_applicant['applicant_email'],
        application_id=sample_applicant['application_id'],
        status=sample_applicant['status'],
        details=sample_applicant['details']
    )
