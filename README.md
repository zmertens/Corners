# Corners

A backend service that provides a REST API to manage corners.
Spring Boot application implementing several Spring libraries like REST data and JPA to store Maze data.

## Payload

The payload and entity fields for a Maze are as follows:

```json
{
  "id": 1,
  "outfile": "binary_tree1.obj",
  "width": 100,
  "height": 10,
  "length": 100,
  "seed": 101,
  "algorithm": "binary_tree"
}
```