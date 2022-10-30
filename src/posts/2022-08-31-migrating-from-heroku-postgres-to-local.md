---
title: Migrating Heroku Postgres Database to a Cloud VM.
description: Here's what you can do
date: 2022-08-31
tags:
  - Heroku
  - Postgres
  - OCI
layout: layouts/post.njk
---

Heroku is ending its free tier starting [28th November 2022](https://blog.heroku.com/next-chapter). It has always been the go-to free hosting solution for hobby devs and students for small & non-commercial projects. (RIP to a lot of tutorials that just went obsolete :D)

One of the best advantages of Heroku's free tier was the Postgres database it offered.

### What are the options?

For devs looking to migrate their apps & databases from Heroku to another free service, there are some excellent alternatives, including, but not limited to:

- [Fly.io](https://fly.io/)
- [Render.com](https://render.com/)
- [Supabase](https://supabase.com/)
- [Railway](https://railway.app/)

While these options are great, there is another way to host your application with zero / minimal costs. These can be by running a VM by any of the top-level providers.

| :exclamation: | Or you could go complete r/selfhosted by running your application on a Raspberry Pi! |
| ------------- | ------------------------------------------------------------------------------------ |

- Google Cloud Platform
- AWS
- Azure
- Digital Ocean's droplets
- Oracle Cloud

The advantage of these is that you will have much more freedom of configuration, as well as them being much less likely to get expensive or get shut down - and have you repeat the painful cycle of migration.

The disadvantage is that you will have to manage the VMs yourself instead of the self-managed infrastructure by something like Heroku, which will mean getting your hands dirty (and maybe, learning something along the way)

Ok, convinced yet? - now let's see how we can migrate the database from Heroku to one of these VMs.

### Exporting Database from Heroku

I will be using the VM instance provided by Oracle Cloud (yes I know you hate Oracle). The upside to this offering is that they give you two free cloud compute instances with 1 GB of memory each forever\* (whatever they mean by forever). That is one of the most generous offerings among all the cloud providers.

Let's start by taking a snapshot of your database in Heroku. We will need the Heroku CLI. [Install](https://devcenter.heroku.com/articles/heroku-cli) it if you haven't already (either on your PC or on the VM itself will do).

```bash
curl https://cli-assets.heroku.com/install-ubuntu.sh | sh
```

Login using your browser

```bash
heroku login
```

To export the data from your Heroku Postgres database, create a new backup and download it. This is pretty trivial.

```bash
heroku pg:backups:capture --app example-app
heroku pg:backups:download --app example-app
```

See [Importing and Exporting Heroku Postgres Databases](https://devcenter.heroku.com/articles/heroku-postgres-import-export) for more details.

This will download a latest.dump file that contains everything you need for migration to a new database.

### Setting up Postgres Instance on VM

SSH into your VM

```bash
ssh -i <your_ssh_key_file> <vm_username>@<public_ip_of_vm>
```

#### Installing PostgreSQL

Install Postgres by running these commands

```bash
# Create the file repository configuration:
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'

# Import the repository signing key:
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -

# Update the package lists:
sudo apt-get update

# Install the latest version of PostgreSQL.
# If you want a specific version, use 'postgresql-12' or similar instead of 'postgresql':
sudo apt-get -y install postgresql
```

Check whether the Postgres service is running

```bash
service postgresql status
```

#### Creating new role and database

PostgreSQL ships with "postgres" role/user & database by default. Let's create our user & database for our app.

Create a user

```bash
sudo -u postgres createuser --interactive
```

```bash
Enter name of role to add: <your_user_name>
Shall the new role be a superuser? (y/n) Y
```

Create a database

```bash
sudo -u postgres createdb <your_db_name>
```

To login into your database, we will need to create a new Linux user, with the same name as our new user/role (See [Peer Authentication](https://www.postgresql.org/docs/current/auth-peer.html))

Create a new Linux user (with the same name as the Postgres user)

```bash
sudo adduser <your_user_name>
```

Switch over to this user and open a PSQL session

```bash
sudo -u <your_user_name> psql
```

Use \conninfo to see your database connection details

```bash
<your_user_name>=# \conninfo
You are connected to database "<your_db_name>" as user <your_user_name> via socket in "/var/run/postgresql" at port "5432".
```

Exit the session

```bash
<your_user_name>=# \q
```

### Restoring Database from Backup

Our database is up and running. Let's import the dump we created from Heroku.

If the dump was downloaded to your PC, transfer it to the VM by using the `scp` command (this must be run from the PC)

Transferring to the home directory.

```bash
scp -i /path/to/ssh_key /path/to/latest.dump <vm_username>@<public_ip_of_vm>:/home/ubuntu
```

SSH back to the VM and just run the pg_restore command

```bash
pg_restore --verbose --clean --no-acl --no-owner -h localhost -U <your_user_name> -d <your_db_name> latest.dump
```

| :exclamation: | There may be a bunch of warnings, but we can ignore them as long as the final database looks fine. |
| ------------- | -------------------------------------------------------------------------------------------------- |

And that's it - our database has been successfully migrated.
