package com.zmertens.corners.domain;

import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.data.rest.core.annotation.RepositoryRestResource;
import org.springframework.web.bind.annotation.CrossOrigin;

import java.util.List;

@RepositoryRestResource
@CrossOrigin
public interface MazeRepository extends CrudRepository<Maze, Long> {

    List<Maze> findByAlgorithm(@Param("algorithm") String algorithm);
}
