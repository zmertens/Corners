import { Application } from 'express';

const express = require('express');

const setNavigations = (app: Application) => {
  app.get('/', (req, res) => {
    res.send('Hello World!');
  });
};

export default setNavigations;