<?php
// Simple secure PHP form handler for Kinsta
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // 1. Sanitize
    $name = strip_tags(trim($_POST["name"]));
    $email = filter_var(trim($_POST["email"]), FILTER_SANITIZE_EMAIL);
    $message = strip_tags(trim($_POST["message"]));

    // 2. Validate
    if ( empty($name) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        header("Location: /contact-error.html");
        exit;
    }

    // 3. Email Settings
    $recipient = "youremail@example.com"; 
    $subject = "New Contact from Website: $name";
    $email_content = "Name: $name\n";
    $email_content .= "Email: $email\n\n";
    $email_content .= "Message:\n$message\n";
    $email_headers = "From: Website <no-reply@yourdomain.com>";

    // 4. Send
    if (mail($recipient, $subject, $email_content, $email_headers)) {
        header("Location: /contact-success.html"); // Redirect to a static thank you page
    } else {
        header("Location: /contact-error.html");
    }
} else {
    // Not a POST request
    header("Location: /");
}
?>