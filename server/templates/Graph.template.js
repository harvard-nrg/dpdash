export default (subject, project, user, name, icon, mail, acl, matrixData, configs, celeryTasks, role) => {
  var userState = {
    "uid": user,
    "name": name,
    "icon": icon,
    "mail": mail,
    "role": role,
    "acl": acl,
    "celeryTasks": celeryTasks,
    'configs': configs
  };
  var subjectState = {
    "sid": subject,
    "project": project
  };
  var graphState = {
    "matrixData": matrixData.matrixData,
    "configurations": matrixData.matrixConfig,
    "consentDate": matrixData.consentDate
  };

  return `<!DOCTYPE html>
		<html>
			<head>
				<meta name="viewport" content="width=device-width, initial-scale=1.0, minimum-scale=1.0">
				<title>${subject} - DPdash</title>
				
				<!-- Add to homescreen for Chrome on Android
				<meta name="mobile-web-app-capable" content="yes">
				<link rel="icon" sizes="192x192" href="images/android-desktop.png">

				Add to homescreen for Safari on iOS
				<meta name="apple-mobile-web-app-capable" content="yes">
				<meta name="apple-mobile-web-app-status-bar-style" content="black">
				<meta name="apple-mobile-web-app-title" content="Material Design Lite">
				<link rel="apple-touch-icon-precomposed" href="images/ios-desktop.png">

				Tile icon for Win8 (144x144 + tile color)
				<meta name="msapplication-TileImage" content="images/touch/ms-touch-icon-144x144-precomposed.png">
				<meta name="msapplication-TileColor" content="#3372DF">-->
				<link rel='stylesheet' href='/css/graph.css'/>
				<script>
					window.USER = ${JSON.stringify(userState)}
					window.SUBJECT = ${JSON.stringify(subjectState)}
					window.GRAPH = ${JSON.stringify(graphState)}
				</script>
			</head>
			<body>
				<div id="graph"></div>
				<script src="/js/graph.min.js">
				</script>
			</body>
		</html>
	`;

};
