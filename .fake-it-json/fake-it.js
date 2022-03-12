const cp = require('child_process');
const os = require('os');
const { jsonc } = require('jsonc');
const fs = require('fs');
const path = require('path');


if (!fs.existsSync('.devcontainer.json')) {
    console.error('No .devcontainer.json found.');
    process.exit(1);
}

const tempFolder = path.join(__dirname, 'temp');
fs.mkdirSync(tempFolder, { recursive: true });
const devcontainer = jsonc.parse(fs.readFileSync('.devcontainer.json', 'utf8'));
devcontainer.onOpenConfigurations.forEach((configName) => {
    const configFolder = path.join(tempFolder, configName);
    fs.mkdirSync(configFolder, { recursive: true });

    const config = devcontainer.configurations[configName];
    config.runServices = config.runServices || [config.service];
    const relativePath = path.relative(configFolder, process.cwd());
    config.dockerComposeFile = config.dockerComposeFile.map((file) => path.join(relativePath, file));

    const configFilePath= path.join(configFolder, '.devcontainer.json');
    console.log(`Creating ${configFilePath}`);
    fs.writeFileSync(path.join(configFolder, '.devcontainer.json'), JSON.stringify(config));

    cp.execSync("devcontainer open " + configFolder, { stdio: 'inherit' });
});

