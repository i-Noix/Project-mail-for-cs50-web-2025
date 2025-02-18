document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#email').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';

  document.querySelector('#compose-form').onsubmit = () => {
    // Get values from the form
    let recipients = document.querySelector('#compose-recipients').value;
    let subject = document.querySelector('#compose-subject').value;
    let body = document.querySelector('#compose-body').value;
  
    // Sending a post request
    fetch('/emails', {
      method: 'POST',
      body: JSON.stringify({
        recipients: recipients,
        subject: subject,
        body: body
      })
    })
    .then(response => response.json())
    .then(result => {
      // Print result
      console.log(result);
  
      // load folder Sent
      load_mailbox('sent');
    })
    .catch(error => {
      console.error('Error:', error);
    });
  
    // Stop form from submit
    return false;
  }
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email').style.display = 'none';

  // Show the mailbox name
  // document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;
  
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
    // print emails
    console.log(emails);
    // Create a new element div
    emails.forEach(element => {
      const tableRow = document.createElement('tr');
      const email = document.createElement('td');
      const subject = document.createElement('td');
      const timestamp = document.createElement('td');

      // Adding all necessaury values from element to the table in div #emails-view
      if (mailbox == 'archive' && element.archived) {
        email.innerHTML = element.sender;
        subject.innerHTML = element.subject;
        timestamp.innerHTML = element.timestamp;
      } else if (!element.archived) {
        if (mailbox == 'inbox') {
          email.innerHTML = element.sender
        } else {
          email.innerHTML = element.recipients
        }
        subject.innerHTML = element.subject;
        timestamp.innerHTML = element.timestamp;
      }
      // Append all td to tableRow
      tableRow.append(email, subject, timestamp);

      // Change background color if email has been read
      if (!element.read) {
        tableRow.style.background = 'grey';
      }
      // Adds an event handler
      tableRow.onclick = () => load_email(element.id);
      // Add div to page
      document.querySelector('#table-row').append(tableRow);
    });
  })
}

function load_email(email_id) {

  // Show the email and and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email').style.display = 'block';
  document.querySelector('#email').innerHTML = '';
  
  fetch(`/emails/${email_id}`)
  .then(response => response.json())
  .then(emails => {
  // Print email
  console.log(emails);
  // Check if emails is unread mark the email as read
  if (emails.read) {
    change_readValue(emails.id);
  }
  // Create a new elements
  const maileDetails = document.createElement('div');
  const mailBody = document.createElement('div');
  maileDetails.innerHTML = `
    <strong>From:</strong> ${emails.sender}<br>
    <strong>To:</strong> ${emails.recipients}<br>
    <strong>Subject:</strong> ${emails.subject}<br>
    <strong>Timestamp:</strong> ${emails.timestamp}<br>
    `
  mailBody.innerHTML = emails.body
  // Add elements to the page
  document.querySelector('#email').append(maileDetails, mailBody);
})
}

function change_readValue(email_id) {
  fetch(`/emails/${email_id}`, {
    method: 'PUT',
    body: JSON.stringify({
      read: false
    })
  }
)}

function archive_email(email_id) {
  fetch(`/emails/${email_id}`, {
    method: 'PUT',
    body: JSON.stringify({
      archived: true
    })
  }
)}

function unarchive_email(email_id) {
  fetch(`/emails/${email_id}`, {
    method: 'PUT',
    body: JSON.stringify({
      archived: false
    })
  }
)}



