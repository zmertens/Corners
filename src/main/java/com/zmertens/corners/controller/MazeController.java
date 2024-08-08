package com.zmertens.corners.controller;

import com.zmertens.corners.domain.Maze;
import com.zmertens.corners.domain.MazeRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class MazeController {

    private final MazeRepository mazeRepository;

    public MazeController(MazeRepository mazeRepository) {
        this.mazeRepository = mazeRepository;
    }

    @GetMapping("/mazes")
    public Iterable<Maze> getMazes() {
        return mazeRepository.findAll();
    }
}
