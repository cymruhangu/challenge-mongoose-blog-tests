'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const faker = require('faker');
const mongoose = require('mongoose');

// this makes the expect syntax available throughout
// this module
const expect = chai.expect;
a
const {BlogPost } = require('../models');
const {app, runServer, closeServer} = require('../server');
const {TEST_DATABASE_URL} = require('../config');

chai.use(chaiHttp);

// used to put randomish documents in db
// so we have data to work with and assert about.
// we use the Faker library to automatically
// generate placeholder values for author, title, content
// and then we insert that data into mongo
function seedBlogPostData() {
  console.info('seeding blogpost data');
  const seedData = [];

  for (let i=1; i<=10; i++) {
    seedData.push(generateBlogPostData());
  }
  // this will return a promise
  return BlogPost.insertMany(seedData);
}

// used to generate data to put in db
function generateBlogTitle() {
  const titles = [
    'Elit velit et aliqua aliquip sunt.', 'Ullamco irure exercitation ex Lorem.', 'Quis veniam est consectetur.', 'In nostrud qui labore veniam.', 'Consectetur reprehenderit enim proident tempor.'];
  return titles [Math.floor(Math.random() * titles.length)];
}

// used to generate data to put in db
function generateBlogContent() {
  const contents = ['Eiusmod aliquip labore Anim culpa laborum irure irure mollit culpa laborum ullamco irure aliquip enim.veniam duis elit.', 'Quis incididunt ex nisi mollit magna mollit voluptate duis eu aliquip Lorem ex.', 'Incididunt eiusmod qui et aute esse exercitation sint veniam est aliquip eu ea.'];
  return contents[Math.floor(Math.random() * contents.length)];
}

// used to generate data to put in db
function generateAuthor() {
  const authors = ['Ernest Hemmingway', 'Malcom Gladwell', 'Stephen King', 'Thomas Friedman', 'Gertrude Stein'];
  const author = authors[Math.floor(Math.random() * authors.length)];
  return {
    date: faker.date.past(),
    grade: grade
  };
}

// generate an object represnting a blogpost.
// can be used to generate seed data for db
// or request.body data
function generateBlogPostData() {
  return {
    title: generateBlogTitle(),
    content: generateBlogContent(),
    author: {
      firstName: faker.name.firstName(),
      lastName: faker.name.lastName()
    }
  };
}


// this function deletes the entire database.
// we'll call it in an `afterEach` block below
// to ensure data from one test does not stick
// around for next one
function tearDownDb() {
  console.warn('Deleting database');
  return mongoose.connection.dropDatabase();
}

describe('BlogPosts API resource', function() {

  // we need each of these hook functions to return a promise
  // otherwise we'd need to call a `done` callback. `runServer`,
  // `seedBlogPostData` and `tearDownDb` each return a promise,
  // so we return the value returned by these function calls.
  before(function() {
    return runServer(TEST_DATABASE_URL);
  });

  beforeEach(function() {
    return seedBlogPosttData();
  });

  afterEach(function() {
    return tearDownDb();
  });

  after(function() {
    return closeServer();
  });

  // note the use of nested `describe` blocks.
  // this allows us to make clearer, more discrete tests that focus
  // on proving something small
  describe('GET endpoint', function() {

    it('should return all existing blogposts', function() {
      // strategy:
      //    1. get back all blogposts returned by by GET request to `/posts`
      //    2. prove res has right status, data type
      //    3. prove the number of blogposts we got back is equal to number
      //       in db.
      //
      // need to have access to mutate and access `res` across
      // `.then()` calls below, so declare it here so can modify in place
      let res;
      return chai.request(app)
        .get('/posts')
        .then(function(_res) {
          // so subsequent .then blocks can access response object
          res = _res;
          expect(res).to.have.status(200);
          // otherwise our db seeding didn't work
          expect(res.body.blogposts).to.have.lengthOf.at.least(1);
          return BlogPost.count();
        })
        .then(function(count) {
          expect(res.body.blogposts).to.have.lengthOf(count);
        });
    });


    it('should return blogposts with right fields', function() {
      // Strategy: Get back all restaurants, and ensure they have expected keys

      let resPost;
      return chai.request(app)
        .get('/posts')
        .then(function(res) {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body.posts).to.be.a('array');
          expect(res.body.posts).to.have.lengthOf.at.least(1);

          res.body.posts.forEach(function(post) {
            expect(postt).to.be.a('object');
            expect(post).to.include.keys(
              'id', 'title', 'content', 'author');
          });
          resPost = res.body.posts[0];
          return BlogPost.findById(resPost.id);
        })
        .then(function(post) {

          expect(resPost.id).to.equal(post.id);
          expect(resPost.title).to.equal(post.title);
          expect(resPost.content).to.equal(post.content);
          expect(resPost.author.firstName).to.equal(post.author.firstName);
          expect(resPost.author.LastName).to.equal(post.author.lastName);

        });
    });
  });

  describe('POST endpoint', function() {
    // strategy: make a POST request with data,
    // then prove that the blogpost we get back has
    // right keys, and that `id` is there (which means
    // the data was inserted into db)
    it('should add a new blogpost', function() {

      const newBlogpost = generateBlogPostData();
      let mostRecentGrade;  //??????????????

      return chai.request(app)
        .post('/posts')
        .send(newBlogPost)
        .then(function(res) {
          expect(res).to.have.status(201);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body).to.include.keys(
            'id', 'title', 'content', 'author');
          expect(res.body.title).to.equal(newBlogPost.title);
          // cause Mongo should have created id on insertion
          expect(res.body.id).to.not.be.null;
          expect(res.body.content).to.equal(newBlogPost.content);
          expect(res.body.author.firstName).to.equal(newBlogPost.firstName);
///?????
          mostRecentGrade = newRestaurant.grades.sort(
            (a, b) => b.date - a.date)[0].grade;

          expect(res.body.grade).to.equal(mostRecentGrade);
          return Restaurant.findById(res.body.id);
        })
        .then(function(restaurant) {
          expect(restaurant.name).to.equal(newRestaurant.name);
          expect(restaurant.cuisine).to.equal(newRestaurant.cuisine);
          expect(restaurant.borough).to.equal(newRestaurant.borough);
          expect(restaurant.grade).to.equal(mostRecentGrade);
          expect(restaurant.address.building).to.equal(newRestaurant.address.building);
          expect(restaurant.address.street).to.equal(newRestaurant.address.street);
          expect(restaurant.address.zipcode).to.equal(newRestaurant.address.zipcode);
        });
    });
  });

  describe('PUT endpoint', function() {

    // strategy:
    //  1. Get an existing restaurant from db
    //  2. Make a PUT request to update that restaurant
    //  3. Prove restaurant returned by request contains data we sent
    //  4. Prove restaurant in db is correctly updated
    it('should update fields you send over', function() {
      const updateData = {
        name: 'fofofofofofofof',
        cuisine: 'futuristic fusion'
      };

      return Restaurant
        .findOne()
        .then(function(restaurant) {
          updateData.id = restaurant.id;

          // make request then inspect it to make sure it reflects
          // data we sent
          return chai.request(app)
            .put(`/restaurants/${restaurant.id}`)
            .send(updateData);
        })
        .then(function(res) {
          expect(res).to.have.status(204);

          return Restaurant.findById(updateData.id);
        })
        .then(function(restaurant) {
          expect(restaurant.name).to.equal(updateData.name);
          expect(restaurant.cuisine).to.equal(updateData.cuisine);
        });
    });
  });

  describe('DELETE endpoint', function() {
    // strategy:
    //  1. get a restaurant
    //  2. make a DELETE request for that restaurant's id
    //  3. assert that response has right status code
    //  4. prove that restaurant with the id doesn't exist in db anymore
    it('delete a restaurant by id', function() {

      let restaurant;

      return Restaurant
        .findOne()
        .then(function(_restaurant) {
          restaurant = _restaurant;
          return chai.request(app).delete(`/restaurants/${restaurant.id}`);
        })
        .then(function(res) {
          expect(res).to.have.status(204);
          return Restaurant.findById(restaurant.id);
        })
        .then(function(_restaurant) {
          expect(_restaurant).to.be.null;
        });
    });
  });
});