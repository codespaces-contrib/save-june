# Embedded devcontainer.json properties example

Like the [monolitic devcontainer.json example](https://github.com/codespaces-contrib/save-june/tree/with-features-monorepo) example, this version of this repository includes two multi-stage Dockerfiles and two .devcontainer.json files that, when combined with Docker Compose, enables multi-container development and takes advantage of the current "dev container features" concept.

However, rather than trying to create a configuration in two separate files, it moves the needed devcontainer.json metadata into `docker-compose.devcontainer.yml` instead using the same properties translated to snake_case under an `x-devcontainer` property. Again, this is not supported by Remote - Containers or Codespaces, but there's a script to fake it.

To try it out on macOS or Linux (no windows yet)

1. Install Docker, VS Code, Remote - Containers, and Node.js
1. Use the **Remote-Containers: Install devcontainer CLI** command
1. Clone the repository to your local machine and switch to this branch.  
1. Run `bash fake-it.sh` from the repository root.

You'll see two windows pop up based on the consolidated .devcontainer.json in the repository root.

The big advantage here is that it allows dropping of several properties and provides a one-stop-shop for all needed configuration.

## How the dev container setup works

The basics here is the same as [monolitic devcontainer.json example](https://github.com/codespaces-contrib/save-june/tree/with-features-monorepo), so this README will not go over them in detail, but rather what this solves.

A key problem with the monolitic devcontainer.json example is that it started to feel like you were creating the exact same structure in both devcontainer.json and docker-compose.devcontainer.yml, and you needed to refer to shared keys to tie it all together. Furthermore, it was not immediately obvious looking at `docker-compose.devcontainer.yml` that there was additional configuration somewhere else tht was required to get it all to work together.

By mirroring the same metadata in the right spot in the yml file itself, we can avoid that problem and cut down the number of needed properties.

e.g. for the `web` service:
```yaml
services:
  web:
    image: save-june-web-devcontainer
    build:
      context: web
      dockerfile: Dockerfile
      target: build-base
    volumes:
      - .:/workspace
    command: sleep infinity
    # Embedded devcontainer metadata
    x-devcontainer:
      parent_compose_files:
        - docker-compose.yml
      workspace_folder: /workspace/web
      remote_user: web
      forward_ports: 
        - db:5432
      ports_attributes:
        "3000":
          label: Web Application
          on_auto_forward: notify
        "5432":
          label: Database
          on_auto_forward: silent
      features:
        common:
          username: web
          upgrade_packages: false
          non_free_packages: true
        chuxel/devcontainer-features/postgres:
          version: latest
          client_only: true
      tools:
        vscode:
          extensions:
            - dbaeumer.vscode-eslint
            - esbenp.prettier-vscode
      post_create_command: npm install
```

One glance at this file, and its clear that there are things here that would not be applied via the straight Docker CLI, and its immediatley obvious how it ties to the services defined in this file.  It also eliminates the need for both the `service`, `runServices` properties entirely.

Finally, this includes a `parent_compose_files` property to emulate the behavior of having an list of compose files, but this technically wouldn't be strictly necessary. However, you would need to be able to specify the list of Compose files to use in this case - which could be the only remaining property in the devcontainer.json file as an alternative.

## Problems with this model

There are several challenges with this model. In particular:

1. As before, while this simplifies setup, there are not a lot of features today since we're still getting going on the concept.

1. You end up referencing the features in devcontainer.json rather than in the Dockerfile or Docker Compose file like you would expect. 

1. As before, you would not get the same environment doing a straight `docker-compose up` as you would using the Remote - Containers to spin up the environment. This could in concept drive you to do it via a dev container CLI, but the public CLI provides no "exec" model to allow this. But all of this would need to be addressed for this model to be adopted, and its clearer here that this would be needed.

1. As before, if you pre-build the devcontainer image and store it in an image registry for performance, its devcontainer.json configuration is still completely disconnected. This makes it very easy to forget something and effectively adds a fourth thing to track in addition to the .devcontainer.json files and docker-compose.devcontainer.yml file.

1. This still wouldn't work in Codespaces today even if the CLI/Remote - Containers supported. Recap of gaps:

    - It neither supports opening folders in a location other than the repo root nor does it allow connecting multiple windows to different containers in the same Codespace.

    - This takes advantage of being able to port forward a different domain to forward the database port (`forwardPorts: [ "db:5432" ]`) which Codespaces does not support. Changing the network type to host or a common network is required, which is not common in Docker Compose setups.

    - Codespaces also does not allow the workspace mount location to vary, so what is set in the docker-compose.yml file is ignored, which is confusing.

1. A related but less severe problem is that there is no way to open both of these containers in the same VS Code window. (E.g. this could be modeled after multi-root workspaces which provides some of the UX hooks needed to do it).

1. There's no automation around adding any content in this repository beyond VS Code's built in extension recommendations today.

----

# Save June: A GitHub Codespaces Adventure

Help! We're about to launch our brand new dog-themed haiku app ("Haikus for June"), but it appears to be...broken. Users are supposed to be able to "heart" photos of June (because she's so cute!), but that gesture no longer seems to be persisted in the database 🤔

We really don't want to post-pone our launch, and so we need to get this working on-the-quick. Codespaces to the rescue! 🦸

<img width="500px" src="https://user-images.githubusercontent.com/116461/93283254-02ecb600-f785-11ea-84a9-83832ed1efc8.png" />

## 🕵️ Your Mission (Should you choose to accept it...)

Help save June. To do this, you're going to need to use Codespaces in order to figure out the source of this bug, fix it, and then send a PR back to this repo. All without doing a single ounce of setup!

> **There's No Place Like \$HOME:** Don't forget to setup your `dotfiles` repo, so that your cloud-powered adventures feel ergonomic and immediately familiar. If you want a cool one to try out, then fork [this repo](https://github.com/lostintangent/dotfiles) before moving on.

Alright, now where were we? To get your investigation started, try the following steps in order to repro the bug:

**Repro steps**:

1. Open the project in a Codespace 👍
1. Open a terminal, which is your window into a full-blown cloud environment. If you setup a `dotfiles` repo, you should see your terminal setup fully intact. If you're using the sample one, then check out the awesome `PS1` prompt and/or try running `l` or `cls` (these are custom aliases!).
1. Spin up the haiku app by running `npm run dev` 💻 
1. Launch the app by `cmd+clicking` the localhost URL that you see in the terminal output 🚀
1. Try to click the heart button for a photo, and note the number of hearts that it now has ❤️
1. Refresh the browser 🌐

**Expected:** For the heart count to be persisted
**Actual:** The heart gesture you just performed isn't persisted 😢

---

So now that we've seen the bug, the question is: <ins>how do you fix it!</ins> To guide you on your journey, and also, make things more enjoyable, here are some interesting things that might be worth trying:

- **Live reload:** Once you've run the app, try changing code and saving it. The web app should automatically reload! For example, edit the `<title>` or `<h1>` element in `views/index.ejs` and watch the header update once you hit `cmd+s` 🔥 <details><summary>ℹ️ Troubleshooting</summary>If for any reason, you get an error about a port already being in use, run `npx kill-port 3000` in a terminal. This isn't a Codespaces bug, but can sometimes happen as a result of the Node process being reloaded to fast.</details>

- **Debugging:** Set a breakpoint in the server code (`src/index.js`) and press `F5` to start a debugging session. You may be able to inspect some state that helps point at the problem. <details><summary>ℹ️ Hint</summary>Set a breakpoint on line 16, try to heart a photo, and then inspect `req.body`. There may be a typo somewhere...(on line 18!)</details>

- **Extensions:** Install an extension or two in order to customize your environment. Here are some fun ideas that make your hard-written code look beautiful: [Bracket Pair Colorizer](https://marketplace.visualstudio.com/items?itemName=CoenraadS.bracket-pair-colorizer-2), [Indent Rainbow](https://marketplace.visualstudio.com/items?itemName=oderwat.indent-rainbow) 💄

- **Uncommitted Changes:** After you've made and save some changes to the code, head back to your list of [Codespaces](https://github.com/codespaces) and try to delete your Codespace. It will warn you that you have uncommitted changes. Data loss prevention FTW! 🙌

- **Version control:** Once you've fixed the bug, go ahead and commit and push that change. Your git credentials are automatically configured for you 👍

- **Dev-box-as-code:** Check out the `.devcontainer/devcontainer.json` file to see how this Codespace was configured to be reproducible. _Note: This sample makes use of Docker/Docker compose in order to illustrate possibilities. However, none of these files are required to get started with Codespaces._

---

If you made it this far, that means that you helped <ins>save June</ins>! Go ahead and pat yourself on the back, and take a coffee break. You just moved your development environment to the cloud, and that makes you pretty darn awesome 😎

<img width="500px" src="https://user-images.githubusercontent.com/116461/93296814-db0d4a80-f7a4-11ea-9bb5-5cd44b7eb39c.png" />
