const cp = require('child_process');
const os = require('os');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

function snakeCaseToCamelCase(snakeCase) {
    let i = 0;
    let camelCase = snakeCase;
    while (i < camelCase.length) {
        if (camelCase[i] === '_') {
            camelCase = camelCase.slice(0, i) + camelCase[i + 1].toUpperCase() + camelCase.slice(i + 2);
        }
        i++;
    }
    return camelCase;
}

function propNamesToCamelCase(obj) {
    if (typeof obj !== 'object') {
        return obj;
    }

    // Array type
    if (Array.isArray(obj)) {
        return obj.map(propNamesToCamelCase);
    }

    // Object type
    const newObj = {};
    Object.keys(obj).forEach((key) => {
        newObj[snakeCaseToCamelCase(key)] = propNamesToCamelCase(obj[key]);
    });
    return newObj;
}

if (!fs.existsSync('docker-compose.devcontainer.yml')) {
    console.error('No docker-compose.devcontainer.yml found.');
    process.exit(1);
}

const tempFolder = path.join(__dirname, 'temp');
fs.mkdirSync(tempFolder, { recursive: true });

const dockerCompose = yaml.load(fs.readFileSync('docker-compose.devcontainer.yml', 'utf8'));
for (let serviceName in dockerCompose.services) {
    const service = dockerCompose.services[serviceName];
    let devcontainer = service['x-devcontainer'];
    if (devcontainer) {
        devcontainer = propNamesToCamelCase(devcontainer);

        const configFolder = path.join(tempFolder, serviceName);
        fs.mkdirSync(configFolder, { recursive: true });
        const relativePath = path.relative(configFolder, process.cwd());

        devcontainer.dockerComposeFile = devcontainer.parentComposeFiles || [];
        devcontainer.dockerComposeFile.push('docker-compose.devcontainer.yml');
        devcontainer.dockerComposeFile = devcontainer.dockerComposeFile.map((file) => path.join(relativePath, file));
        devcontainer.parentComposeFiles = undefined;

        devcontainer.service = serviceName;
        devcontainer.runServices = devcontainer.runServices || [serviceName];

        if(devcontainer.tools) {
            for (let prop in devcontainer.tools.vscode) {
                devcontainer[prop] = devcontainer.tools.vscode[prop];
            }
            devcontainer.tools = undefined;    
        }

        const configFilePath = path.join(configFolder, '.devcontainer.json');
        console.log(`Creating ${configFilePath}`);
        fs.writeFileSync(path.join(configFolder, '.devcontainer.json'), JSON.stringify(devcontainer));

        cp.execSync("devcontainer open " + configFolder, { stdio: 'inherit' });
    }
}
