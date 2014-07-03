var keystone = require('keystone'),
  Types = keystone.Field.Types;

/**
 * PostArchive Model
 * ==================
 */

var PostArchive = new keystone.List('PostArchive', {
  autokey: { from: 'name', path: 'key', unique: true }
});

PostArchive.add({
  name: { type: String, required: true },
  date: { type: String, required: true },
  postId: { type: String, required: true }
});

PostArchive.relationship({ ref: 'Post', path: 'archives' });

PostArchive.register();
