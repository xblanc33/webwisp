# WebWisp

This is a simple agent, made during my internship at [LaBRI](https://www.labri.fr/), that can be used to navigate through a website while also
testing it. The agent uses OpenAI's GPT-4o model to generate the actions to take on the website.

## Installation

The repository uses [Bun](https://bun.sh) to manage the project.
To install Bun, run the following command:

```bash
curl -fsSL https://bun.sh/install | bash
```

Then, clone the repository and install the dependencies:

```bash
git clone git@github.com:brewcoua/webwisp.git --recursive
cd webwisp
bun install
```

Finally, you can run WebWisp with the following command:

```bash
bun start
```

It can also be fully built and compiled with the following command:

```bash
bun build
```

and found at `./dist/webwisp`. It will however require the `openai` and `playwright` packages to be available as they are kept external to the binary.

## Configuration

The agent can be configured through environment variables.
The following environment variables can be set:

-   `OPENAI_API_KEY`: The OpenAI API key to use for the agent. **_Required_**
-   `OPENAI_ORG` : The OpenAI organization to use for the agent.
-   `OPENAI_PROJECT`: The OpenAI project to use for the agent.

It also has flags that can be set:

-   `--target, -t`: The target website to navigate. Will otherwise be prompted.
-   `--task, -k`: The task to perform on the website. Will otherwise be prompted.
-   `--voice, -v`: Use voice recognition to get the task to perform. Off by default and overriden by target and task flags.
-   `--help`: Display the help message.
-   `--version, -V`: Display the version of the agent.
-   `--verbose`: Display more information about the agent's actions.

## License

This project is licensed under either of the following, at your option:

-   Apache License, Version 2.0, ([LICENSE-APACHE](LICENSE-APACHE) or http://www.apache.org/licenses/LICENSE-2.0)
-   MIT License ([LICENSE-MIT](LICENSE-MIT) or http://opensource.org/licenses/MIT)

Unless you explicitly state otherwise, any contribution intentionally submitted for inclusion in the work by you,
as defined in the Apache-2.0 license, shall be dual licensed as above, without any additional terms or conditions.
