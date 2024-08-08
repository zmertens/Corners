package com.zmertens.corners.domain;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.validation.constraints.NotNull;

@Entity
public class Maze {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long id;

    @NotNull
    private String file, algorithm;

    private int width, height, length, seed;

    public Maze() {
    }

    public Maze(String file, String algorithm, int width, int height, int length, int seed) {
        this.file = file;
        this.algorithm = algorithm;
        this.width = width;
        this.height = height;
        this.length = length;
        this.seed = seed;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getFile() {
        return file;
    }

    public void setFile(String file) {
        this.file = file;
    }

    public String getAlgorithm() {
        return algorithm;
    }

    public void setAlgorithm(String algorithm) {
        this.algorithm = algorithm;
    }

    public int getWidth() {
        return width;
    }

    public void setWidth(int width) {
        this.width = width;
    }

    public int getHeight() {
        return height;
    }

    public void setHeight(int height) {
        this.height = height;
    }

    public int getLength() {
        return length;
    }

    public void setLength(int length) {
        this.length = length;
    }

    public int getSeed() {
        return seed;
    }

    public void setSeed(int seed) {
        this.seed = seed;
    }

    @Override
    public String toString() {
        return "Maze{" +
                "id=" + id +
                ", file='" + file + '\'' +
                ", algorithm='" + algorithm + '\'' +
                ", width=" + width +
                ", height=" + height +
                ", length=" + length +
                ", seed=" + seed +
                '}';
    }
}
