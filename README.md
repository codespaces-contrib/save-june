# Monolitic devcontainer.json example

Like the [current state + features](https://github.com/codespaces-contrib/save-june/tree/with-features) example, this version of this repository includes two multi-stage Dockerfiles and two .devcontainer.json files that, when combined with Docker Compose, enables multi-container development and takes advantage of the current "dev container features" concept.

What it adds is the ability to centralize devcontainer.json config across the two services into one file to reduce the brittleness of the solution. This isn't supported by Remote - Containers today, but there's a script that mocks it up. 

To try it out on macOS or Linux (no windows yet)

1. Install Docker, VS Code, Remote - Containers, and Node.js
1. Use the **Remote-Containers: Install devcontainer CLI** command
1. Clone the repository to your local machine and switch to this branch.  
1. Run `bash fake-it.sh` from the repository root.

You'll see two windows pop up based on the consolidated .devcontainer.json in the repository root.

This would be most applicable applications developed in monorepos, though you could have a "bootstrap" repository you use to set things up with the actual service code being in separate repository.

## How the dev container setup works

The basics here is the same as [current state + features](https://github.com/codespaces-contrib/save-june/tree/with-features#how-the-dev-container-setup-works), so this README will not go over them in detail, but rather what this solves.

A key problem with the current state + features model is how brittle getting features to work would be. There is a `runServices` in devcontainer.json that was mandatory **mandatory**, and could break the moment you added a dependency between the `web` and `worker` services in `docker-compose.yml`.

Instead, there is a single .devcontainer.json file in it with sections:

```jsonc
{
    "onOpenConfigurations": ["web", "worker"],
    "configurations" : {
        "worker": {
            // Config goes here
        },
        "web": {
            // Config goes here        
        }
    }
}
```

No matter what configuration is built, the contents of each configuration would be applied to the docker-compose file. As a result, you would never be able to start `worker` without the configuration for `web` being applied or vice versa. Dependencies therefore would not cause a problem.

This model is also a bit more consistent with existing .devcontainer folders found at the top of the repository root, which helps with understanding what would happen.

The `onOpenConfigurations` property (whether this is the right name) could then include the behavior of which of these services to connect to right away to avoid the number of steps required to open them separately.

## Problems with this model

There are several challenges with this model. In particular:

1. As before, while this simplifies setup, there are not a lot of features today since we're still getting going on the concept.

1. You end up referencing the features in devcontainer.json rather than in the Dockerfile or Docker Compose file like you would expect. 

1. As before, you would not get the same environment doing a straight `docker-compose up` as you would using the Remote - Containers to spin up the environment. This could in concept drive you to do it via a dev container CLI, but the public CLI provides no "exec" model to allow this. But all of this would need to be addressed for this model to be adopted.

1. The required configuration for the dev container it split between two files in and you need to know exactly how the devcontainer.json properties work to tie them together. This also becomes **even more odd** when you include multiple configurations that end up mirroring the Docker Compose file itself. This makes automating this sample difficult and pushes devs to reading through docs to get going.

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
