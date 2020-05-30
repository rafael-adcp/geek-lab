# Geek Lab

Quickest way to:
- ramp someone to a new project / organization.
- swap between projects and executing your favorite scripts

Pros:
- quick setup
- Agnostic from operational system (aka cross-platform)
- Share usefull commands with the community / your team / or simply keep things to your self
- Agnostic of language, call your `.py`, `.sh`, `.java`...

## Instalation
```
npm i -g geek-lab
```

[Check out our docs...](https://github.com/rafael-adcp/geek-lab/tree/master/docs)

## Building / Tagging / Publishing
```
git fetch
git pull origin master

npm version patch
npm publish

git push origin master --no-verify
git tag 1.2.2
git push origin 1.2.2 --no-verify
```