'use strict';
const axios = require('axios').default;

module.exports.endpoint = async (event) => {

  let statusCode = 400;
  let message = "Unknown Error";

  try {
    // const instance = await axios.create({
    //   url: 'https://api.thousandeyes.com/v6/endpoint-data/tests/web/http-server/65367.json',
    //   method: 'get',
    //   auth: {
    //     username: 'hashlock@thousandeyes.com',
    //     password: 'ncea6wpdaeps5vnxwpmc1eo0tvkjb5p5'
    //   }
    //   // params: { Authorization: "Basic hashlock@thousandeyes.com:ncea6wpdaeps5vnxwpmc1eo0tvkjb5p5" }
    // });

    await axios({
      url: 'https://api.thousandeyes.com/v6/endpoint-data/tests/web/http-server/65367',
      method: 'get',
      auth: {
        username: process.env.TE_USER,
        password: process.env.TE_TOKEN
      },
      params: {aid: 302351}
    })
    .then(function (response) {
      statusCode = response.status;
      message = response.data;
    })
    .catch(error => {
      statusCode = 501;
      message = `${error}`;
    });
  } catch (error) {
      statusCode = 501;
      message = `${error.message}`; // message 
  }

  // Response object must be in {statusCode: , body: } format:
  let response = { 
    statusCode: statusCode, 
    body: JSON.stringify( {
        message
      },
      null,
      2
    ),
    headers: {
      'Access-Control-Allow-Origin': '*', // Required for CORS support to work
      'Access-Control-Allow-Credentials': true, // Required for cookies, authorization headers with HTTPS
    }
  };
  
  
  return response;
  // return {
  //   statusCode: 200,
  //   body: JSON.stringify(
  //     {
  //       message: 'Go Serverless v1.0! Your function executed successfully!',
  //       input: event,
  //     },
  //     null,
  //     2
  //   ),
  // };

  // Use this code if you don't use the http event with the LAMBDA-PROXY integration
  // return { message: 'Go Serverless v1.0! Your function executed successfully!', event };
};

module.exports.status = async (event) => {

  let statusCode = 400;
  let message = "Unknown Error";

  try {
    await axios({
      url: 'https://api.thousandeyes.com/v6/status/',
      method: 'get',
      username: 'hashlock@thousandeyes.com',
      password: 'ncea6wpdaeps5vnxwpmc1eo0tvkjb5p5'
    })
    .then(function (response) {
      statusCode = response.status;
      message = response.data;
    })
    .catch(error => {
      statusCode = 501;
      message = `${error}`;
    });
  } catch (error) {
      statusCode = 501;
      message = `${error.message}`; // message 
  }

  // Response object must be in {statusCode: , body: } format:
  let response = { 
    statusCode: statusCode, 
    body: JSON.stringify( {
        message
      },
      null,
      2
    ),
    headers: {
      'Access-Control-Allow-Origin': '*', // Required for CORS support to work
      'Access-Control-Allow-Credentials': true, // Required for cookies, authorization headers with HTTPS
    }
  };
  
  
  return response;
  // return {
  //   statusCode: 200,
  //   body: JSON.stringify(
  //     {
  //       message: 'Go Serverless v1.0! Your function executed successfully!',
  //       input: event,
  //     },
  //     null,
  //     2
  //   ),
  // };

  // Use this code if you don't use the http event with the LAMBDA-PROXY integration
  // return { message: 'Go Serverless v1.0! Your function executed successfully!', event };
};
