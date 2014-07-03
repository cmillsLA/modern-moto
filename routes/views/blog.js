var keystone = require('keystone'),
  async = require('async');

exports = module.exports = function(req, res) {

  var view = new keystone.View(req, res),
    locals = res.locals;

  // Init locals
  locals.section = 'blog';
  locals.filters = {
    category: req.params.category,
    year: req.params.year,
    month: req.params.month
  };
  locals.data = {
    posts: [],
    categories: [],
    archives: []
  };

  // Load all categories
  view.on('init', function(next) {

    keystone.list('PostCategory').model.find().sort('name').exec(function(err, results) {

      if (err || !results.length) {
        return next(err);
      }

      locals.data.categories = results;

      // Load the counts for each category
      async.each(locals.data.categories, function(category, next) {

        keystone.list('Post').model.count().where('category').in([category.id]).exec(function(err, count) {
          category.postCount = count;
          next(err);
        });

      }, function(err) {
        next(err);
      });

    });

  });

  // Load the current category filter
  view.on('init', function(next) {

    if (req.params.category) {
      keystone.list('PostCategory').model.findOne({ key: locals.filters.category }).exec(function(err, result) {
        locals.data.category = result;
        next(err);
      });
    } else {
      next();
    }

  });

  // Load all archives in decscending order
  view.on('init', function(next) {
    keystone.list('PostArchive').model.find().sort({'date': -1}).exec(function(err, results) {

      if (err || !results.length) {
        return next(err);
      }

      var filteredResults = [];

      // Remove duplicate archives
      for(var i=0; i<results.length; i++) {
        if(i === 0) {
          filteredResults.push(results[i]);
        } else {
          var prevArchive = i - 1;
          if(results[i].name != results[prevArchive].name) {
            filteredResults.push(results[i]);
          }
        }
      }

      locals.data.archives = filteredResults;

      next(err);

    });
  });

  // Load the posts
  view.on('init', function(next) {

    var q = keystone.list('Post').paginate({
      page: req.query.page || 1,
      perPage: 10,
      maxPages: 10
    })
      .where('state', 'published')
      .sort('-publishedDate')
      .populate('author categories');

    if (locals.data.category) {
      q.where('categories').in([locals.data.category]);
    }

    if (locals.filters.year && locals.filters.month) {
      var postMonth = locals.filters.month - 1;
      var postYear = locals.filters.year;
      var start = new Date(postYear, postMonth, 1, 0);
      var end = new Date(postYear, postMonth + 1, 0, 23,59,59);
      q.find({publishedDate: { $gte: start, $lt: end }});
    }

    q.exec(function(err, results) {
      locals.data.posts = results;
      next(err);
    });

  });

  // Render the view
  view.render('blog');

};
