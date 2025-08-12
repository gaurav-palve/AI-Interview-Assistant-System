import smtplib

sender_email = input("Enter sender's email: ")
receiver_email = input("Enter receiver's email: ")

subject = input("Subject: ")
msg = input("Email msg: ")

# Build the email body
text = f"Subject: {subject}\n\n{msg}"

# Correct SMTP server and port for Gmail
server = smtplib.SMTP("smtp.gmail.com", 587)
server.starttls()

# IMPORTANT: Use App Password, not your normal password
app_password = input("Enter your Google App Password: ")

server.login(sender_email, app_password)
server.sendmail(sender_email, receiver_email, text)
server.quit()

print("Email has been sent successfully!")
