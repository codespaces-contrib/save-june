# Current state example

This version of this repository includes two multi-stage Dockerfiles and two .devcontainer.json files that, when combined with Docker Compose, enables multi-container development. This variation does **not** include any dev container features and serves as a baseline. However, the sample includes a way to generate a dev container, build, and production image from the same content.

To try it out:

1. Clone the repository to your local machine and switch to this branch.  
2. Open the `web` folder in a container using the Remote - Containers extension.
3. Open a new window, and then open the `worker` folder in a container using the Remote - Containers extension.

Each window will have contents specifically for working with that part of the application while sharing a common database.

## How the dev container setup works

For the devcontainer / CI / production examples, this sample uses the Dockerfile not only for creating the image, but to build the production version of the application. See [here](./web/Dockerfile) and [here](./worker/Dockerfile).

The key to this working as expected without bloating the image size can be found in the two production stages. The first uses the build image to build the application in a temporary layer. This is then thrown away and only the result of the build is copied into the final production image. In the [Go-based worker](./worker/Dockerfile), the Go tooling itself is excluded entirely from the production image since the output of the build is a binary.

The `devcontainer` stage in each includes unqiue requirements for inner loop development in addition to a `build-base` stage that is used in generating the production image.

There are three Docker Compose files in this project:
1. `docker-compose.yml` - Contains common configuration across all environments.
2. `docker-compose.prod.yml` - Contains production (or test) specific settings like publishing the applicaiton port.
3. `docker-compose.devcontainer.yml` - The largest of the three, this includes content specific to the dev container environment.

In this case, `docker-compose.devcontainer.yml` points to a specific stage (`target`) in the Dockerfile (or a pre-built image). This `devcontainer` stage extends the core `build-base` stage with tools needed to build the application to include other convenances and utilities. Specifically:

1. A postgres CLI tool - not needed outside of a dev container
2. Utilities needed for the inner loop for Go for the worker - e.g. gopls

To start the dev containers, you would list two Docker Compose files:

```
 docker-compose up -f docker-compose.yml -f docker-compose.devcontainer.yml .
 ```

 While for the production version, you'd add the prod compose file instead:

```
 docker-compose up -f docker-compose.yml -f docker-compose.prod.yml .
 ```

This pattern and other properties can be found in the .devcontainer.json files under `web` and `worker`. For example for `web`:

```json
    "workspaceFolder": "/workspace/web",
    "dockerComposeFile": [
        "../docker-compose.yml",
        "../docker-compose.devcontainer.yml"
    ],
    "service": "web",
    "runServices": ["web"],
```

In this case, the source code was mounted to `/workspace` in `docker-compose.yml` so `git` functions, which is why the `workspaceFolder` is set to `/workspace/web`. The service's name is `web`, and when this dev container is started, only the web and db containers need to be started. 

Technically, `runServices` is optional, but we'll use this to our advantage next. It tells Docker Compose that it only needs to start this service and its dependencies (like the `db` container) rather than all of them at once.

The `worker` devcontainer.json then references a different service, but with the similar arguments.

```json
    "workspaceFolder": "/workspace/worker",
    "dockerComposeFile": [
        "../docker-compose.yml",
        "../docker-compose.devcontainer.yml"
    ],
    "service": "worker",
    "runServices": ["worker"],
```

## Problems with this model

There are several challenges with this model. In particular:

1. Knowing what to add into each stage of the multi-stage Dockerfiles can be difficult, and there's no built in way to reuse content across projects which leads to lots of cut-and-paste work.

    - While it may be obvious once you have done it once, knowing how to setup these things can be confusing to those who have not scripted it before (e.g.g the shell is non-interactive) and are devs are often used to going through a tool like "brew" instead. (And adding brew to the image makes it large unfortunately, so you'd do it on a case-by-case basis.) 

    - While centralized teams that know Dockerfiles will have experience with some of this, devs may want to add "one more thing" and not know how to do it - and some of these (like docker-in-docker) are deceptivley tricky.

1. The required configuration for the dev container it split between three files in three locations and you need to know exactly how the devcontainer.json properties work to tie them together. This makes automating this sample difficult and pushes devs to reading through docs to get going.

1. Some config that is development specific that you would expect to be able to set in devcontainer.json must be set in `docker-compose.devcontainer.yaml` in this case. Worse yet, these are very specific to this use case and would not be done in a production container that you'd normally find information on. For example, the following is required to get Go debugging to work, but isn't needed for anything else related to Go:

    ```yaml
    # 👇 Need to know to add these by hand ☹️
    cap_add:
      - SYS_PTRACE
    security_opt:
      seccomp:unconfined
    ```

1. If you pre-build the devcontainer image and store it in an image registry for performance, its devcontainer.json configuration is completely disconnected. This makes it very easy to forget something and effectively adds a fourth thing to track in addition to the .devcontainer.json files and docker-compose.devcontainer.yml file.

1. This doesn't work in Codespaces today. Gaps:

    - It neither supports opening folders in a location other than the repo root nor does it allow connecting multiple windows to different containers in the same Codespace.

    - This takes advantage of being able to port forward a different domain to forward the database port (`forwardPorts: [ "db:5432" ]`) which Codespaces does not support. Changing the network type to host or a common network is required, which is not common in Docker Compose setups.

    - Codespaces also does not allow the workspace mount location to vary, so what is set in the docker-compose.yml file is ignored, which is confusing.

1. A related but less severe problem is that there is no way to open both of these containers in the same VS Code window. (E.g. this could be modeled after multi-root workspaces which provides some of the UX hooks needed to do it).

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
