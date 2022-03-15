# Supporting devcontainer.json properties as lables

Like the [embedded devcontainer.json properties example](https://github.com/codespaces-contrib/save-june/tree/embedded) example, this version of this repository includes two multi-stage Dockerfiles, a Docker Compose with devcontainer.json properties inside it, and takes advantage of the current "dev container features" concept.

The added concept is to also allow devcontainer.json properties to be specified metadata labels in the Dockerfile or on the image itself.

Unlike the others, there's no mock up for this model yet. 

## How the dev container setup works

The basics here is the same as [embedded devcontainer.json properties example](https://github.com/codespaces-contrib/save-june/tree/embedded), so this README will not go over them in detail, but rather what this solves.

A remaining issue that still exists is that a number of devcontainer.json properties really tie to the image rather than anything else, and separating them actually creates problems.

For example, the `remoteUser` property can contain the user VS Code should use to connect to the container regardless of what it is run as. This username can vary by image, so you have to remember to add it to devcontainer.json.

This gets worse when you pre-build an image, particularly when features are in use. For the Go example, once the Go feature has been added to a pre-built container image, the addition of the ptrace capability should be applied in all cases. Today, you still have to reference the feature to ensure that kicks in - the same goes for all extensions.

We can alter processing instead to look at the image to understand what devcontainer.json properties have already been applied. In the simple cases, this would allow you to just reference an image with no other content if the image was pre-built with devcontainer.json metadata.  

In the Docker Compose case, it would allow less to be added into the `x-devcontainer` property. For other orchestrators, this could be the primary way of specifying the needed metadata in a common way.

For example, in the web Dockerfile:
```Dockerfile
LABEL "com.microsoft.devcontainer.remoteUser": "web"
LABEL "com.microsoft.devcontainer.portsAttributes": "{ \"3000\": { \"label\": \"Web Application\", \"onAutoForward\": \"notify\" }"
```

These two properties do not need to be included in the Docker Compose file, or in devcontainer.json if the image is referenced directly for this to happen.

At this point, you could enable a workflow where you:

1. Create a devcontainer.json for the metadata you want to add to any pre-built image. e.g. any of our `mcr.microsoft.com/vscode/devcontainer/...` images

2. Pre-build and publish using the devcontainer CLI

3. Any devcontainer.json file just would include the image property, and the same thing would work for Docker Compose.


```json
{
    "image": "ghcr.io/yourorg/yourprebuiltimage"
}
```
...or...
```yaml
services:
   web:
      image: ghcr.io/yourorg/yourprebuiltimage
```

This does not remove the need for devcontainer.json when you are not pre-building, but given this is a best practice, it helps significantly in simplifying use and reuse, forgetting to add configuration, and **should work with any orchestrator that can reference an image**.

## Problems with this model

There are a few remaining challenges with this model. In particular:

1. As before, while this simplifies setup, there are not a lot of features today since we're still getting going on the concept.

1. As before, you would not get the same environment doing a straight `docker-compose up` as you would using the Remote - Containers to spin up the environment. This could in concept drive you to do it via a dev container CLI, but the public CLI provides no "exec" model to allow this.

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
