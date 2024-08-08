package com.zmertens.corners;

import com.zmertens.corners.domain.Maze;
import com.zmertens.corners.domain.MazeRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class CornersApplication implements CommandLineRunner {

	private static final Logger logger = LoggerFactory.getLogger(CornersApplication.class);

	private final MazeRepository mazeRepository;
	
	public CornersApplication(MazeRepository mazeRepository) {
		this.mazeRepository = mazeRepository;
	}
	
	public static void main(String[] args) {
		SpringApplication.run(CornersApplication.class, args);
	}

	@Override
	public void run(String... args) throws Exception {
		mazeRepository.save(new Maze("maze1.txt", "binary_tree", 100, 100, 10, 12345));
		mazeRepository.save(new Maze("maze2.txt", "sidewinder", 1000, 3, 1000, 12345));
		mazeRepository.save(new Maze("maze3.obj", "sidewinder", 100, 100, 10, 12345));
		mazeRepository.save(new Maze("maze4.txt", "binary_tree", 100, 100, 10, 12345));
		mazeRepository.save(new Maze("maze5.obj", "binary_tree", 100, 100, 10, 12345));

		for (Maze maze : mazeRepository.findAll()) {
			logger.info(maze.toString());
		}
	}
}
