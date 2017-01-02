<?php 
require 'db_login.php';
ini_set('default_charset', 'UTF-8');
	
	$publisheritem = $_POST['publisheritem'];
	$isbn = $_POST['isbn'];
	$isbn_valid = $_POST['isbn_valid'];
	$issn = $_POST['issn'];
	$year = $_POST['year'];
	$series = $_POST['series'];
	$title = $_POST['title'];
	$subtitle = $_POST['subtitle'];
	$filename = $_POST['filename'];
	$id = $_POST['id'];
	$xml = $_POST['xml'];
	
	// create connection
	$conn = new mysqli($db_servername, $db_username, $db_password, $db_database);
	$xml = $conn->real_escape_string($xml);
	mysqli_set_charset($conn, 'utf8');
	// check connection
	if($conn->connect_error) {
		die("Connection failed: " .  $conn->connect_error); 
	}

	$sql = "INSERT INTO $db_table ( id, publisheritem, isbn, isbn_valid, issn, year, series, title, subtitle, filename, xml)";
	$sql .=               "VALUES ('$id', '$publisheritem','$isbn', '$isbn_valid', '$issn','$year','$series','$title','$subtitle','$filename','$xml');";



	if($conn->query($sql) === TRUE) {
		echo "</br><strong>Success!</strong></br></br><strong>json data:</strong></br></br>" . $xml;
	} else {
		echo "<div style='color:red' class='error'></br><strong>Error!</strong></br></br>" . "<strong>json data:</strong></br></br>" . $xml . "</br><strong>sql:</strong></br>" . $sql . "</br></br>" . "<strong>Error:</strong> </br></br>" . $conn->error . "</div>"; 
	}

	$conn->close();
?>