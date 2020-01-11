# Custom Actions

This feature was idealized to allow you to connect all your actions (aka scripts) into one place with the mindset of:
- make life easier even when swapping from projects / machines
- summarize everything into one place
- make things easy to share therefore making everyones life easier

Imagine a scenario where you are working on a company and there are severals teams handling different kind of applications and using different operational systems.

We bet that:
- each team owns a set of **magic scripts** that perform some **whitchcraft** or just grab informations easier / faster then manually looking into something;
- a developer coded some neat scripts to make his own life easier / faster

Now image if you could easly share all of those, agnostic of platform and still control it?

TADA `custom-actions`

```
Sample usage of "custom-actions"
+------------------------+
|                        |
|  geek-lab              |
|  (globally installed)  |
|                        |
+----|----|----|---------+
     |    |    |
     |    |    |
     |    |    |               +----------------------------------------------+
     |    |    |               | geek-lab                                     |
     |    |    |               | (at your local machine after npm i...)       |
     |    |    ----------------- geek-lab config # to se path                 |
     |    |                    | eg: /home/USER/geek-lab_local                |
     |    |                    | where your config / metrics file are stored  |
     |    |                    +----------------------------------------------+
     |    |
     |    |                    +----------------------------------------------+
     |    |                    | /home/USER/awesome_team1/custom_actions      |
     |    |                    | # add this path to your cli config           |
     |    ---------------------- # and all actions inside of that folder will |
     |                         | # appear when you do "geek-lab help"         |
     |                         +----------------------------------------------+
     |
     |                         +----------------------------------------------+
     |                         | /home/USER/awesome_team2/custom_actions      |
     --------------------------- # add this path to your cli config           |
                               | # and all actions inside of that folder will |
                               | # appear when you do "geek-lab help"         |
                               +----------------------------------------------+

created with: https://textik.com/
```

By providing `paths` via config key `customActionsPath`, the cli will automatically import them to your local `geek-lab` setup. (**note**: all files within this path must be compatible with the cli)

For the diagram your config would look like this:
```BASH
> gik config

Configuration file can be found at "/home/USER/geek-lab_local"
{
 ...
 "customActionsPath": [
  "/home/USER/awesome_team1/custom_actions",
  "/home/USER/awesome_team2/custom_actions"
 ],
 ...
}
```

And all files inside of those paths must follow this shape:
```javascript
// file name: custom_action_sample.js

/* usefull references:
https://github.com/yargs/yargs/blob/master/docs/advanced.md
http://yargs.js.org/

and off course current existing "actions" geek-lab\src\actions
*/
exports.command = 'COMMAND';
exports.describe = 'DESCRIPTION';

exports.builder = (yargs) => yargs
  .example('$0 COMMAND', 'description of what this usage will do');

exports.handler = () => {

  console.log('All the things :: your first custom action worked')
};

```
