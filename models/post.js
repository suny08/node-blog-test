var mongodb = require('./db');
var markdown = require('markdown').markdown;
function Post(name, title, post) {
    this.name = name;
    this.title = title;
    this.post = post;
}

module.exports = Post;

//存储文章
Post.prototype.save = function (callback) {
    var date = new Date();
    var time = {
        date: date,
        year: date.getFullYear(),
        month: date.getFullYear() + '-' + (date.getMonth() + 1),
        day: date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDay(),
        minute: date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDay() + " " + date.getHours() + ":" + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes())
    };
    var post = {
        name: this.name,
        title: this.title,
        time: time,
        post: this.post,
        comments: []
    };
    mongodb.open(function (err, db) {
        if (err) {
            mongodb.close();
            return callback(err);
        }
        db.collection('posts', function (err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            collection.insert(post, {safe: true}, function (err) {
                mongodb.close();
                if (err) {
                    return callback(err);
                } else {
                    return callback(null);
                }
            });
        });
    });
};

//获取所有文章
Post.prototype.getAll = function (name, callback) {
    mongodb.open(function (err, db) {
        if (err) {
            mongodb.close();
            return callback(err);
        }
        db.collection('posts', function (err, collection) {
            if (err) {
                mongodb.close();
                return callback();
            }
            var query = {};
            if (name) {
                query.name = name;
            }
            collection.find(query).sort({time: -1}).toArray(function (err, doces) {
                mongodb.close();
                if (err) {
                    return callback(err);
                } else {
                    doces.forEach(function (doc) {
                        doc.post = markdown.toHTML(doc.post);
                    });
                    return callback(null, doces);
                }
            });
        });
    });
};

//获取一篇文章
Post.prototype.getOne = function (name, day, title, callback) {
    mongodb.open(function (err, db) {
        if (err) {
            mongodb.close();
            return callback(err);
        }
        db.collection('posts', function (err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            collection.findOne({
                "name": name,
                "time.day": day,
                "title": title
            }, function (err, doc) {
                mongodb.close();
                if (err) {
                    return callback(err);
                }
                if (doc) {
                    doc.post = markdown.toHTML(doc.post);
                    doc.comments.forEach(function (comment) {
                        comment.content = markdown.toHTML(comment.content);
                    })
                }
                callback(null, doc);
            });
        });
    });
};

//获取要更新的文章
Post.prototype.edit = function (name, day, title, callback) {
    mongodb.open(function (err, db) {
        if (err) {
            mongodb.close();
            return callback(err);
        }
        db.collection('posts', function (err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            var query = {
                "name": name,
                "time.day": day,
                "title": title
            };
            collection.findOne(query, function (err, doc) {
                mongodb.close();
                if (err) {
                    return callback(err);
                }
                return callback(null, doc);
            });
        })
    })
};

//更新文章
Post.prototype.update = function (name, day, title, post, callback) {
    mongodb.open(function (err, db) {
        if (err) {
            mongodb.close();
            return callback(err);
        }
        db.collection('posts', function (err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            var query = {
                "name": name,
                "time.day": day,
                "title": title
            };
            collection.update(query, {$set: {post: post}}, {safe: true}, function (err, result) {
                mongodb.close();
                if (err) {
                    return callback(err);
                }
                return callback(null);
            })
        })
    })
};

// 删除文章
Post.prototype.remove = function (name, day, title, callback) {
    mongodb.open(function (err, db) {
        if (err) {
            mongodb.close();
            return callback(err);
        }
        db.collection('posts', function (err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            var query = {
                "name": name,
                "title": title,
                "time.day": day
            };
            collection.remove(query, {w: 1}, function (err) {
                mongodb.close();
                if (err) {
                    return callback(err);
                } else {
                    return callback(null);
                }
            })
        })
    })
};

// 获取十片文章
Post.prototype.getTen = function (name, page, callback) {
    // 打开数据库
    mongodb.open(function (err, db) {
        if (err) {
            mongodb.close();
            return callback(err);
        }
        db.collection('posts', function (err, collection) {
            if (err) {
                mongodb.close();
                return callback(err);
            }
            var query = {};
            if (name) {
                query.name = name;
            }
            //使用count返回特定查询的文档数total
            collection.count(query, function (err, total) {

                var skip = (page - 1) * 10;
                var limit = 10;
                collection.find(
                    query,
                    {skip: skip, limit: limit}
                ).sort({time: -1}).toArray(function (err, docs) {
                    mongodb.close();
                    if (err) {
                        return callback(err);
                    }
                    docs.forEach(function (doc) {
                        doc.post = markdown.toHTML(doc.post);
                    });
                    return callback(null, docs, total);
                });
            });
        });
    });
};

// 返回所有文档的存档信息
Post.prototype.getArchive=function(callback){
//打开数据库
    mongodb.open(function(err,db){
        if(err){
            mongodb.close();
            return callback(err);
        }
        db.collection('posts',function(err,collection){
            if(err){
                mongodb.close();
                return callbacke(err);
            }
            collection.find({},{
                "name":1,
                "title":1,
                "time":1
            }).sort({
                time:-1
            }).toArray(function (err,docs) {
                mongodb.close();
                if(err){
                    return callback(err);
                }
                callback(null,docs);
            })
        })
    })
};
