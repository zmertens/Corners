package com.zmertens.corners;

import com.zmertens.corners.controller.MazeController;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.assertj.core.api.AssertionsForClassTypes.assertThat;

@SpringBootTest
class CornersApplicationTests {

	@Autowired
	MazeController mazeController;

	@Test
	void contextLoads() {
		assertThat(mazeController).isNotNull();
	}

}
