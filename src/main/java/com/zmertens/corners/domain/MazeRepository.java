package com.zmertens.corners.domain;

import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface MazeRepository extends CrudRepository<Maze, Long> {

    List<Maze> findByAlgorithm(@Param("algorithm") String algorithm);
}
