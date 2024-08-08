# Corners

This web service is implementing several Spring libraries like REST data and JPA to store maze-related data.

## Payload and API

The payload and APIs for Corners are as follows:

```json
{
  "id": 1,
  "file": "binary_tree1.obj",
  "width": 100,
  "height": 10,
  "length": 100,
  "seed": 101,
  "algorithm": "binary_tree"
}
```

  * POST /api/mazes
    * Content-Type: application/json
  * GET /api/mazes/{id}
  * PUT /api/mazes/{id}
    * Content-Type: application/json
  * DELETE /api/mazes/{id}

## Build, Run, and Test
  * Preqrequisites
    - Java 17
    - Gradle
    - MySQL (or another database)

`.\gradlew.bat build` OR `./gradlew build`

## Run

`.\gradlew.bat bootRun` OR `./gradlew bootRun`
