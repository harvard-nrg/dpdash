![](https://github.com/pnlbwh/pnlpipe/blob/py3-compatible/Misc/pnl-bwh-hms.png)

This documentation has been developed through first hand experiment of independent DPdash instantiation. 
It can be primarily followed for running DPdash. Some other details including PHOENIX style directory tree 
can be found at http://docs.neuroinfo.org/dpdash/en/latest/ .


Table of Contents
=================

  * [Get image](#get-image)
     * [Download](#download)
     * [Build](#build)
  * [Use image](#use-image)
     * [Define](#define)
        * [Required variables](#required-variables)
        * [Optional variables](#optional-variables)
        * [Using variables in your shell](#using-variables-in-your-shell)
     * [Initialize](#initialize)
     * [Run](#run)
     * [Import](#import)
        * [Verify import](#verify-import)
        * [Set up access](#set-up-access)
     * [View](#view)
     * [Configure](#configure)
     * [Quit](#quit)
     * [Restart](#restart)
  * [Reverse proxy](#reverse-proxy)
  * [Troubleshooting](#troubleshooting)
     * [Logs](#logs)
     * [Cookies](#cookies)

Table of Contents created by [gh-md-toc](https://github.com/ekalinin/github-markdown-toc)


## Get image

### Download

    wget https://www.dropbox.com/s/eew4kj86fci6sdp/dpdash.sif


### Build

Advanced users are advised to build the image in their own machine:

    git clone https://github.com/PREDICT-DPACC/dpdash.git
    cd dpdash/singularity
    singularity build dpdash.sif Singularity


## Use image

Once you have the image, follow the next steps to initialize database, import local data 
into the database, instantiate DPdash, and run it.


### Define

Begin by creating a file called `.env` in the `dpdash/singularity` directory. A sample `.env` file, called `.env.sample`, is provided for your convenience and demonstrates the correct format for defining variables. You may wish to copy its contents to `.env` before proceeding.

As this file contains your custom configuration, it will not be committed to the repository.

#### Required variables

In your `.env` file, define the following required variables:

> * **`state`**: Used to store DPdash application data. Must be an empty directory that will be populated with files once you initialize below.
> * **`data`**: Used to store DPdash project data. Must contain [PHOENIX style directory trees](http://docs.neuroinfo.org/dpdash/en/latest/quick_start.html#create-data-persistence-directories).
> * **`DPDASH_IMG`**: The path of the `dpdash.sif` image file you downloaded or built.

#### Optional variables

If you wish to configure ports and other options for services (for example, if running a second DPdash instance on the same machine as another), you may define the following optional variables:

> * **`DPDASH_PORT`**: Can be used to change the port on which DPdash will run (default: 8000)
> * **`DPDASH_SERVICE_HOST`**: Can be used to change the hostname on which services such as MongoDB and RabbitMQ will run (default: whatever your current `hostname` is)
> * **`DPDASH_MONGO_PORT`**: Can be used to change the port on which MongoDB will run (default: 27017)
> * **`DPDASH_RABBIT_DIST`**: Can be used to change the port on which RabbitMQ distribution services will communicate (default: 25671)
> * **`DPDASH_RABBIT_NAME`**: Cab be used to change the RabbitMQ node name (default: rabbit)
> * **`DPDASH_RABBIT_PORT`**: Can be used to change the port on which RabbitMQ will run (default: 5671)
> * **`DPDASH_SUPERVISOR_ID`**: Can be used to change the ID name used by supervisord process (default: supervisor)
> * **`DPDASH_DEV_DIR`**: Can be used to set a development directory for use with the Singularity container

We found changing all of these necessary to run two instances on one machine and avoid collisions.

#### Using variables in your shell

We provide a script to load from `.env` called `loadenv.sh`, which can be run in your shell after defining these variables like so: 

    cd dpdash/singularity
    source ./loadenv.sh

This script will make the values available in your shell. Where `${state}` and `${data}` are referenced below, it is assumed that you ran `loadenv.sh` in this manner.

You may also wish to run `source ./varcheck.sh` before proceeding to make sure that your variables are defined properly.


### Initialize
    
    cd dpdash/singularity
    ./init.sh

If you are in a development environment without the ability to serve the app on HTTPS, you must make the following modification:

    ${state}/dpdash/configs/dashboard/config.js: config.session.cookie.secure = false;

Production environments using HTTPS and a valid SSL certificate for the app's domain should leave this setting as is.

You can read the [Cookies](#cookies) section for details.
    

### Run

Launch a DPdash instance as follows:
    
    singularity run \
    -B ${state}:/data \
    -B ${state}/dpdash/configs/dashboard:/sw/apps/dpdash/server/configs \
    -B ${state}/dpdash/dist:/sw/apps/dpdash/dist \
    -B ${data}:/project_data \
    ${DPDASH_IMG} \
    /sw/apps/dpdash/singularity/run.sh
    
Alternatively, you can shell into the container and then execute further commands. In fact, this would be the recommended method for working with the image.
    
    singularity shell \
    -B ${state}:/data \
    -B ${state}/dpdash/configs/dashboard:/sw/apps/dpdash/server/configs \
    -B ${state}/dpdash/dist:/sw/apps/dpdash/dist \
    -B ${data}:/project_data \
    ${DPDASH_IMG}

    Singularity> cd /sw/apps/dpdash/singularity/
    Singularity> ./run.sh

At this point, you can even exit from the Singularity shell and yet your DPdash instance would be running.

> **Note:** We also provide a convenience script in the `singularity` directory called `start.sh`, which can be run on its own to launch the DPdash instance, or run with the `-s` flag to shell into the Singularity container. (If you wish to mount a development directory to `/sw/apps/dpdash`, you can also set the `${DPDASH_DEV_DIR}` environment variable and use the `-d` flag: `start.sh -s -d`.) 
> 
> However, `start.sh` (and `stop.sh`) scripts come with a fixed `singularity` command. If you need to mount arbitrary directories or modify the `singularity` command, you will not be able to use the convenience scripts. In that case, use the `singularity` command directly in your terminal as shown above.


### Import

After initializing a DPdash instance, data need to be imported inside a mongo database. This step happens outside 
the Singularity container and requires https://github.com/PREDICT-DPACC/dpimport. Follow the steps there to install and use it.

`dpimport`: `import.py` requires a [config.yml](https://github.com/PREDICT-DPACC/dpimport/blob/378f99a13a215581f91a9c7feeecefb59a506d1d/examples/config.yml). 
You can edit the example with proper values of:

    ssl_keyfile:
    ssl_certfile:
    ssl_ca_certs:
    username:
    password:
    port: 27017
    auth_source: admin
    db: dpdata
    hostname:


Proper values of the above keys can be found in `${state}/dpdash/configs/dashboard/config.js`.


#### Verify import

After `import.py`, you can verify if your data went inside mongo database:

    singularity shell -B ${state}:/data -B ${data}:/project_data ${DPDASH_IMG}

    Singularity> mongo --tls --host `hostname` --tlsCAFile /data/ssl/ca/cacert.pem --tlsCertificateKeyFile /data/ssl/mongo_client.pem


Inside mongo shell:

    > use admin
    > db.auth("username", "password")   // located in ${state}/dpdash/configs/dashboard/config.js
    > show dbs
    > use dpdata                        // the db name specified in config.yml for import.py
    > show collections
    > db.collection_name.findOne()      // one collection_name from the collections
    > db["collection_name"].find()      // useful when collection_name has . or - in it


#### Set up access

Assuming you have imported one `BLS_metadata.csv` file into the mongo database, take a look at the following example 
to learn how `dpdash` user is given access to the `BLS` study:
 
    Singularity> mongo --tls --host `hostname` --tlsCAFile /data/ssl/ca/cacert.pem --tlsCertificateKeyFile /data/ssl/mongo_client.pem

Inside mongo shell:
 
    > use admin
    > db.auth("dpdash", "password")                                   // located in ${state}/dpdash/configs/dashboard/config.js
    > show dbs
    > use dpdmongo
    > db.users.find()
    > db.users.update({"uid": "dpdash"}, {$set: {"access": ["BLS"]}}) // BLS comes from BLS_metadata.csv


### View

Firstly, make sure the following prints the login page:

    curl -L http://0.0.0.0:8000

Then, try to view the login page in a web browser. Finally, enter the admin credentials and see if they work. 
If they do not, see the [Cookies](#cookies) section.

**Note:** If you have setup DPdash in a headless remote server, you should need to set up [reverse proxy](#reverse-proxy) 
in the remote server to be able to view the login page in a local web browser.

**Note:** If you changed your port value from 8000 using the `DPDASH_PORT` variable in `.env`, then substitute your port here and in all future cases where 8000 is written.

### Configure

Add and enable at least one configuration from the left taskbar.


### Quit

You can stop the DPdash instance with a Singularity command:

    singularity run \
    -B ${state}:/data \
    -B ${state}/dpdash/configs/dashboard:/sw/apps/dpdash/server/configs \
    -B ${state}/dpdash/dist:/sw/apps/dpdash/dist \
    -B ${data}:/project_data \
    ${DPDASH_IMG} \
    /sw/apps/dpdash/singularity/quit.sh

Or you may use our convenience script, `stop.sh`:

    cd dpdash/singularity
    ./stop.sh
    
### Restart

Advanced users can save a good amount of time restarting the DPdash instance rather than doing a run-quit-run cycle. 
To be able to do that, define the [DPdash variables](https://github.com/PREDICT-DPACC/dpdash/blob/dcdc3ca702df688a2cc73376c2929415e0fd6c0b/singularity/run.sh#L30) in the Singularity shell:

    singularity shell \
    -B ${state}:/data \
    -B ${state}/dpdash/configs/dashboard:/sw/apps/dpdash/server/configs \
    -B ${state}/dpdash/dist:/sw/apps/dpdash/dist \
    -B ${data}:/project_data \
    ${DPDASH_IMG}

    Singularity> cd /sw/apps/dpdash/
    Singularity> # define the DPdash variables
    Singularity> npm restart

Similarly, you can do `npm start` or `npm stop`.


## Reverse proxy

If `curl -L http://0.0.0.0:8000` works successfully, you can go ahead and set up Nginx reverse proxy. [Here](http://docs.neuroinfo.org/dpdash/en/latest/quick_start.html#setting-up-a-reverse-proxy) are some details about it. 
Essentially, you will need to add the following section in a `server{}` block in `/etc/nginx/nginx.conf`:

```cfg
    location / {
            proxy_pass http://127.0.0.1:8000/;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
    }
```

Eventually, you should be able to see DPdash login page in a web browser against your server hostname.


## Troubleshooting

### Logs

* DPdash app

        tail -f ${state}/dpdash/dpdash.log

and

        Singularity> cd /sw/apps/dpdash/
        Singularity> ./node_modules/pm2/bin/pm2 log

* mongodb

        tail -f ${state}/dpdash/mongodb/logs/mongod.log

* supervisord
        
        tail -f ${state}/dpdash/supervisord/logs/supervisord.log

* rabbitmq

        tail -f ${state}/dpdash/rabbitmq/rabbit@rc-predict.log

* celery
        
        tail -f ${state}/dpdash/celery/celery.log


### Cookies

By default, DPdash [cookies are not transferred](http://docs.neuroinfo.org/dpdash/en/latest/building.html?highlight=cookies) over unencrypted HTTP. 

Due to this limitation, after entering admin credentials in the DPdash login page, you may be dropped back to login again. This will occur when you are using the app over HTTP or do not have a valid HTTPS certificate for your domain. To circumvent this issue, set the following to `false`:

    ${state}/dpdash/configs/dashboard/config.js: config.session.cookie.secure = false;

and then [restart](#restart) the DPdash application.

Note that this is not secure and should only be used in a development environment. A production environment should be served over HTTPS with a valid certificate, and with this set to `true`.

See the [express-session docs](https://expressjs.com/en/resources/middleware/session.html) for more information.

**Note**: The developers use a reverse proxy to serve the production DPdash instance, and thus we have set the following to `true` by default. If you do not use a reverse proxy and want stricter security settings, you may set it to `false` or remove it altogether:

    ${state}/dpdash/configs/dashboard/config.js: config.session.proxy = true;
