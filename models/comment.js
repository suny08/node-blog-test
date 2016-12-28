var mongodb=require('./db');

function Comment(name,day,title,comment){
  this.name=name;
  this.day=day;
  this.title=title;
  this.comment=comment;
}

module.exports=Comment;

Comment.prototype.save=function(callback){
  var name=this.name;
  var day=this.day;
  var title=this.title;
  var commnet=this.comment;

  mongodb.open(function(err,db){
    if(err){
      mongodb.close();
      return callback(err);
    }
    db.collection('posts',function(err,collection){
      if(err){
        mongodb.close();
        return callback(err);
      }
      var query={
        "name":name,
        "time.day":day,
        "title":title
      };
      collection.update(query,{$push:{"comments":commnet}},function(err){
        mongodb.close();
        if(err){
          return callback(err);
        }else{
          return callback(null);
        }
      });
    });
  });
};
