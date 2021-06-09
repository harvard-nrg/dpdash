export default (project, user, name, icon, role, acl, celeryTasks, matrixData, configurations) => {
  var userState = {
    "uid": user,
    "name": name,
    "icon": icon,
    "role": role,
    "acl": acl,
    "celeryTasks": celeryTasks
  };
  var subjectState = {
    "project": project
  };
  var graphState = {
    "matrixData": matrixData,
    "configurations": configurations
  };
  return `<!DOCTYPE html>
        <html>
            <head>
                <meta name="viewport" content="width=device-width, initial-scale=1.0, minimum-scale=1.0">
                <title>${project} - DPdash</title>

                <meta name="mobile-web-app-capable" content="yes">
                <link rel="icon" sizes="192x192" href="images/android-desktop.png">
                <meta name="apple-mobile-web-app-capable" content="yes">
                <meta name="apple-mobile-web-app-status-bar-style" content="black">
                <meta name="apple-mobile-web-app-title" content="Material Design Lite">
                <link rel="apple-touch-icon-precomposed" href="images/ios-desktop.png">
                <link rel="stylesheet" href="/css/study.css" />
                <meta name="msapplication-TileImage" content="images/touch/ms-touch-icon-144x144-precomposed.png">
                <meta name="msapplication-TileColor" content="#3372DF">
                <script>
                    window.USER = ${JSON.stringify(userState)}
                    window.SUBJECT = ${JSON.stringify(subjectState)}
                    window.GRAPH = ${JSON.stringify(graphState)}
                </script>
            </head>
            <body>
                <div id="graph"></div>
                <script src="/js/study.min.js">
                </script>
            </body>
        </html>
    `;
}
