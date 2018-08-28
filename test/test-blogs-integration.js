'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const faker = require('faker');
const mongoose = require('mongoose');

// this makes the expect syntax available throughout
// this module
const expect = chai.expect;

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
    return seedBlogPostData();
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
          expect(res.body).to.have.lengthOf.at.least(1);  ///////////
          return BlogPost.count();
        })
        .then(function(count) {
          expect(res.body).to.have.lengthOf(count);
        });
    });


    it('should return blogposts with right fields', function() {
      // Strategy: Get back all blogposts, and ensure they have expected keys

      let resPost;
      return chai.request(app)
        .get('/posts')
        .then(function(res) {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body).to.be.a('array');
          expect(res.body).to.have.lengthOf.at.least(1);

          res.body.forEach(function(post) {
            expect(post).to.be.a('object');
            expect(post).to.include.keys(
              'id', 'title', 'content', 'author');
          });
          resPost = res.body[0];
          // console.log(resPost);
          return BlogPost.findById(resPost.id);
        })
        .then(function(post) {

          expect(resPost.id).to.equal(post.id);
          expect(resPost.title).to.equal(post.title);
          expect(resPost.content).to.equal(post.content);
          // console.log(`author is ${resPost.author}`);
          expect(resPost.author).to.equal(post.authorName);

        });
    });
  });

  describe('POST endpoint', function() {
    // strategy: make a POST request with data,
    // then prove that the blogpost we get back has
    // right keys, and that `id` is there (which means
    // the data was inserted into db)
    it('should add a new blogpost', function() {

      const newBlogPost = generateBlogPostData();
      
      return chai.request(app)
        .post('/posts')
        .send(newBlogPost)  /////////////////
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

          return BlogPost.findById(res.body.id);
        })
        .then(function(blogpost) {
          expect(blogpost.title).to.equal(newBlogPost.title);
          expect(blogpost.content).to.equal(newBlogPost.content);
          expect(blogpost.author.firstName).to.equal(newBlogPost.author.firstName);
          expect(blogpost.author.firstName).to.equal(newBlogPost.author.firstName);
        });
    });
  });

  describe('PUT endpoint', function() {

    // strategy:
    //  1. Get an existing blogpost from db
    //  2. Make a PUT request to update that blogpost
    //  3. Prove blogpost returned by request contains data we sent
    //  4. Prove blogpost in db is correctly updated
    it('should update fields you send over', function() {
      const updateData = {
        title: 'fofofofofofofof',
        content: 'Non veniam aute consectetur enim sit nisi id.',
        author: {
          firstName: 'Walter',
          lastName: 'Cronkite'
        }
      };

      return BlogPost
        .findOne()
        .then(function(blogpost) {
          updateData.id = blogpost.id;

          // make request then inspect it to make sure it reflects
          // data we sent
          return chai.request(app)
            .put(`/posts/${blogpost.id}`)
            .send(updateData);
        })
        .then(function(res) {
          expect(res).to.have.status(204);

          return BlogPost.findById(updateData.id);
        })
        .then(function(blogpost) {
          expect(blogpost.title).to.equal(updateData.title);
          expect(blogpost.cuisine).to.equal(updateData.cuisine);
        });
    });
  });

  describe('DELETE endpoint', function() {
    // strategy:
    //  1. get a blogpostt
    //  2. make a DELETE request for that blogpost's id
    //  3. assert that response has right status code
    //  4. prove that blogpost with the id doesn't exist in db anymore
    it('delete a blogpost by id', function() {

      let blogpost;

      return BlogPost
        .findOne()
        .then(function(_blogpost) {
          blogpost = _blogpost;
          return chai.request(app).delete(`/posts/${blogpost.id}`);
        })
        .then(function(res) {
          expect(res).to.have.status(204);
          return BlogPost.findById(blogpost.id);
        })
        .then(function(_blogpost) {
          expect(_blogpost).to.be.null;
        });
    });
  });
});