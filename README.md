# txt-to-folder-compiler
This program compiles a yaml-like text file into folders, which can then be interpreted by folder interpreters

## Example
```yaml
1
 3 # repeat this folder 3 times
  1
 1
2
```
the above file will produce a directory structure that looks like the following
```json
[
    [
        [
            []
        ],
        [
            []
        ],
        [
            []
        ],
        []
    ],
    [],
    []
]

```

## Command Usage
```
node f.js source_name [optional:dest_name]
```
