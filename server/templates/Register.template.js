export default (message) => {
  var userState = {
    "message": message,
  };
  return `
        <!DOCTYPE html>
        <html>
            <head>
                <meta name="viewport" content="width=device-width, initial-scale=1.0, minimum-scale=1.0">
                <link rel='stylesheet' href='/css/register.css' />
                <title>Sign Up - DPdash</title>
            </head>
                <script>
                    window.USER = ${JSON.stringify(userState)}
                    window.SUBJECT = ${JSON.stringify(null)}
                    window.GRAPH = ${JSON.stringify(null)}
                </script>
            <body>
                <div id = "main"></div>
                <script src="/js/register.min.js">
                </script>
            </body>
        </html>
    `;
};
