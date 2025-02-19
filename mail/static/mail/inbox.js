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
  document.querySelector('#name').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // Update table-row
  document.querySelector('#table-row').innerHTML = '';
  
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
    // print emails
    console.log(emails);
    
    // Create a new element
    emails.forEach(email => {
      const tableRow = document.createElement('tr');
      const emailCell = document.createElement('td');
      const subject = document.createElement('td');
      const timestamp = document.createElement('td');
      const action = document.createElement('td')
      const button = document.createElement('button');

      // Adding all necessaury values from element to the table in div #emails-view
      emailCell.innerHTML = email.sender;
      subject.innerHTML = email.subject;
      timestamp.innerHTML = email.timestamp;

      if (mailbox === 'inbox' && !email.archived) {
        button.innerText = 'Archive';
        button.setAttribute('class', 'btn btn-warning');
        button.onclick = () => archive_email(email.id, true);
      } else if (mailbox === 'archive' && email.archived) {
        button.innerText = 'Unarchive';
        button.setAttribute('class', 'btn btn-danger');
        button.onclick = () => archive_email(email.id, false);
      }

      if (mailbox !== 'sent') {
        action.appendChild(button);
      }
      
      tableRow.append(emailCell, subject, timestamp, action);

      // Change background color if email has been read
      if (!email.read) {
        tableRow.style.backgroundColor = '#f2f6fc';
      }
      // Adds an event handler
      tableRow.onclick = () => {
        // Check if emails is unread mark the email as read
        if (email.read && mailbox === 'inbox') {
          change_readValue(email.id, mailbox);
        } else {
          load_email(email.id, mailbox);
        }
      }
      // Add div to page
      document.querySelector('#table-row').append(tableRow);
    });
  })
}

function load_email(email_id, mailbox) {

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
  // Create a new elements
  const maileDetails = document.createElement('div');
  const mailBody = document.createElement('div');
  const btnReply = document.createElement('button');
  maileDetails.innerHTML = `
    <strong>From:</strong> ${emails.sender}<br>
    <strong>To:</strong> ${emails.recipients}<br>
    <strong>Subject:</strong> ${emails.subject}<br>
    <strong>Timestamp:</strong> ${emails.timestamp}<br>
    `
  // Create the button Reply and add event handler
  if (mailbox !== 'sent') {
    btnReply.innerText = 'Reply';
    btnReply.setAttribute('class', 'btn btn-primary');
    btnReply.onclick = () => reply_email(emails.sender, emails.subject, emails.timestamp, emails.body);
  
    // Append btn
    maileDetails.append(btnReply);
  }
  mailBody.innerText = emails.body
  // Add elements to the page
  document.querySelector('#email').append(maileDetails, mailBody);
})
}

function change_readValue(email_id, mailbox) {
  fetch(`/emails/${email_id}`, {
    method: 'PUT',
    body: JSON.stringify({
      read: false
    })
  })
  .then(() => load_email(email_id, mailbox));
}

function archive_email(email_id, archived) {
  fetch(`/emails/${email_id}`, {
    method: 'PUT',
    body: JSON.stringify({
      archived: archived
    })
  })
  .then(() => load_mailbox('inbox'));
}

function reply_email(recipient, subject, timestamp, body) {
  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#email').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';

  // Pre-fill the composition form
  document.querySelector('#compose-recipients').value = recipient;
  // If the subject line already begins with Re delete it
  let subjectWithoutRe = subject.replace('Re: ', '');
  document.querySelector('#compose-subject').value = `Re: ${subjectWithoutRe}`;
  let replyMessage = `On ${timestamp} ${recipient} wrote:\n${body}\n\n`;
  document.querySelector('#compose-body').value = replyMessage;
  // Add Event handler for form
  document.querySelector('#compose-form').onsubmit = () => {
    // Get values from the form
    let newRecipients = document.querySelector('#compose-recipients').value;
    let newSubject = document.querySelector('#compose-subject').value;
    let newBody = document.querySelector('#compose-body').value;
    let responseBody = newBody.replace(replyMessage, '');

    // Insert the new body message above the previous messages
    newBody = `${responseBody}\n\nOn ${timestamp}, ${recipient} wrote:\n${body}`
    
  
    // Sending a post request
    fetch('/emails', {
      method: 'POST',
      body: JSON.stringify({
        recipients: newRecipients,
        subject: newSubject,
        body: newBody
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


