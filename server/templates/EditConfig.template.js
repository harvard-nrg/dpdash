export default (user, goal, id) => {
  var userState = {
    "uid": user,
    "goal": goal,
    "config": id
  };
  return `
		<!DOCTYPE html>
		<html>
			<head>
				<meta name="viewport" content="width=device-width, initial-scale=1.0, minimum-scale=1.0">
				<title>Edit Configuration - DPdash</title>
				<script>
					window.USER = ${JSON.stringify(userState)}
                    window.SUBJECT = ${JSON.stringify(null)}
                    window.GRAPH = ${JSON.stringify(null)}
				</script>
			</head>
			<body>
				<div id="main"></div>
				<script src="/js/editConfig.min.js"></script>
			</body>
		</html>
	`;
};
