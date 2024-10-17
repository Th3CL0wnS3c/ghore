Unofficial fork of https://github.com/p-balu/ghore

All credits go to the original author : https://github.com/p-balu

See Original repo for more informations.

# Ghore (GitHub offline renderer)

This fork has been done to add a multiples instance functionnality.
Will be removed if changes are done on the official version.

- [New Features](#new-features)
- [Requirements](#requirements)
- [Installation](#installation)
- [Installing package globally](#installing-package-globally)
- [Configuration](#configuration)
- [Contributing](#contributing)
- [License](#license)

## New Features

See original repo for features. Only new ones are detailed here.

- Launch multiple instances of ghore at once using `ghore preview file.md &`
- Each instance is tracked inside a temporary file in the following format :

| PATH              | FILE       | URL                   |
|-------------------|------------|-----------------------|
| /home/user        | README.md  | http://localhost:5178 |
| /home/user        | INSTALL.md | http://localhost:5200 |
| /home/user/ghore/ | README.md  | http://localhost:5174 |

- File is auto-created in a temp directory using equivalent to `mktemp -d` and is updated on the fly
      - When a file is not processed anymore by ghore, matching line is removed in temporary file
- If file exists or directory `ghore-` exist in temp directory (/tmp or whatever /var/tmp/s3/xxxx on macOS for example), use existing file

**Example:**
![Screenshot](https://github.com/Th3CL0wnS3c/ghore/blob/master/screenshot.png)

## `Requirements`

Requires the latest version of nodejs 20.10.0 or above.

## `Installation`

```bash
# Clone the repository
git clone https://github.com/Th3CL0wnS3c/ghore.git

# Navigate to the project directory
cd ghore

# Install dependencies
npm install

#To start the application locally
npm start `your/filepath/README.md`
```

## Installing package globally

Install the package globally

```sh
npm link
```

`npm link` is used instead of `npm install` because modified code is not registred in npmregistry to avoid conflicts with original author code.

### Start the application in 2 different ways

If you are already inside the directory where README.md file exists then run

```bash
ghore preview
```

#### or

```sh
ghore preview /path/toyour/README.md
```

#### or for multiples instances
```sh
ghore preview <file.md> &
```

## Configuration

You can customize the appearance of the HTML output by modifying the included CSS file (`styles.css`).

## Contributing

If you think of contributing, do it directly on the original version ;)

## License

This project is licensed under the [MIT License](LICENSE).
