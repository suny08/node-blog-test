var crypto = require('crypto');
var User = require('../models/user');
var Post = require('../models/post');
var Comment = require('../models/comment');
var multer = require('multer');
var upload = multer({dest: './public/images'});

module.exports = function (app) {

    // 首页
    app.get('/', function (req, res) {
        // 判断是否是第一页
        var page = req.query.p ? parseInt(req.query.p) : 1;

        var postOb = new Post(null, null, null,null);
        postOb.getTen(null, page, function (err, posts, total) {
            if (err) posts = [];
            var info = {
                title: "BLOG-首页",
                user: req.session.user,
                success: req.flash('success').toString(),
                error: req.flash('error').toString(),
                posts: posts,
                isFirstPage: (page - 1) == 0,
                isLastPage: ((page - 1) * 10 + posts.length) == total,
                page: page,
                total: total
            }
            res.render('index', info);
        })
    });

    // 注册
    app.get('/reg', checkNotLogin);
    app.get('/reg', function (req, res) {
        var info = {
            title: "注册",
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        };
        res.render('reg', info);
    });
    app.post('/reg', checkNotLogin);
    app.post('/reg', function (req, res) {
        var name = req.body.name;
        var password = req.body.password;
        var passwordRe = req.body['password-repeat'];
        var email = req.body.email;
        if (password != passwordRe) {
            req.flash('error', '两次输入的密码不一致');
            return res.redirect('/reg');
        }

        var md5 = crypto.createHash('md5');
        password = md5.update(password).digest('hex');
        var userInfo = {
            name: name,
            password: password,
            email: email
        }
        var newUser = new User(userInfo);

        newUser.get(name, function (err, user) {
            if (err) {
                req.flash('error', err);
                return res.redirect('/');
            }
            if (user) {
                req.flash('error', '用户已存在');
                return res.redirect('/reg');
            }
            newUser.save(function (err, user) {
                if (err) {
                    req.flash('error', err);
                    return res.redirect('/reg');
                }
                req.session.user = user;
                req.flash('success', '注册成功');
                res.redirect('/');
            });
        });
    });

    // 登录
    app.get('/login', checkNotLogin);
    app.get('/login', function (req, res) {
        var info = {
            title: "登录",
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        }
        res.render('login', info);
    });
    app.post('/login', checkNotLogin);
    app.post('/login', function (req, res) {
        var name = req.body.username;
        var md5 = crypto.createHash('md5');
        var password = md5.update(req.body.password).digest('hex');
        var userInfo = {
            name: name,
            password: password
        };
        var userOb = new User(userInfo);
        userOb.get(name, function (err, user) {
            if (!user) {
                req.flash('error', "用户不存在");
                return res.redirect('/login');
            }
            if (user.password != password) {
                req.flash('error', '密码错误');
                return res.redirect('/login');
            }
            req.session.user = user;
            req.flash('success', '登录成功');
            return res.redirect('/');
        })
    });

    // 发表文章
    app.get('/post', checkLogin);
    app.get('/post', function (req, res) {
        var info = {
            title: "发表",
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        }
        res.render('post', info);
    });
    app.post('/post', checkLogin);
    app.post('/post', function (req, res) {
        var currentUser = req.session.user;
        var tags = [req.body.tag1, req.body.tag2, req.body.tag3];
        var postOb = new Post(currentUser.name, req.body.title, tags, req.body.post);
        postOb.save(function (err) {
            if (err) {
                req.flash('error', err);
                return res.redirect('/');
            }
            req.flash('success', '发布成功');
            res.redirect('/')
        })
    });

    // 上传
    var uploadFile = [
        {name: 'file1'},
        {name: 'file2'},
        {name: 'file3'},
        {name: 'file4'},
        {name: 'file5'}];
    app.get('/upload', checkLogin);
    app.get('/upload', function (req, res) {
        var info = {
            title: "文件上传",
            user: req.session.user,
            success: req.flash('success').toString(),
            error: req.flash('error').toString()
        };
        res.render('upload', info);
    });
    app.post('/upload', checkLogin);
    app.post('/upload', upload.fields(uploadFile), afterUpload);

    app.get('/archive', function (req, res) {
        var PostOb = new Post(null, null, null,null);
        PostOb.getArchive(function (err, posts) {
            if (err) {
                req.flash('error', err);
                return res.redirect('/');
            }
            var info = {
                title: "存档",
                posts: posts,
                user: req.session.user,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            };
            res.render('archive', info);
        })
    });

    //文章列表
    app.get('/u/:name', function (req, res) {
        //检查用户是否存在
        var userInfo = {
            name: '',
            password: '',
            email: ''
        };
        var userOb = new User(userInfo);
        var postOb = new Post(null, null, null,null);
        var page = req.query.p ? parseInt(req.query.p) : 1;
        userOb.get(req.params.name, function (err, user) {
            if (!user) {
                req.flash('error', '用户不存在');
                return res.redirect('/');
            }
            postOb.getTen(null, page, function (err, posts, total) {
                if (err) {
                    req.flash('error', err);
                    return res.redirect('/');
                }
                var info = {
                    title: user.name,
                    posts: posts,
                    user: req.session.user,
                    success: req.flash('success').toString(),
                    error: req.flash('error').toString(),
                    isFirstPage: (page - 1) == 0,
                    isLastPage: ((page - 1) * 10 + posts.length) == total,
                    page: page,
                    total: total
                };
                console.log(info);
                res.render('user', info);
            });
        });
    });
    app.get('/u/:name/:day/:title', function (req, res) {
        var postOb = new Post(null, null, null,null);
        var name = req.params.name;
        var day = req.params.day;
        var title = req.params.title;
        postOb.getOne(name, day, title, function (err, post) {
            if (err) {
                req.flash('error', err);
                return res.redirect('/');
            }
            var info = {
                title: req.params.title,
                post: post,
                user: req.session.user,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            }
            res.render('article', info);
        })
    });
    app.post('/u/:name/:day/:title', function (req, res) {
        var date = new Date();
        var time = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " + date.getHours() + ":" + (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes());
        var comment = {
            name: req.body.name,
            email: req.body.email,
            website: req.body.website,
            time: time,
            content: req.body.content
        };
        var name = req.params.name;
        var day = req.params.day;
        var title = req.params.title;
        var newComment = new Comment(name, day, title, comment);
        newComment.save(function (err) {
            if (err) {
                req.flash('error', err);
                return res.redirect('back');
            } else {
                req.flash('success', '留言成功');
                res.redirect('back');
            }
        })
    });

    // 更新文章
    app.get('/edit/:name/:day/:title', checkLogin);
    app.get('/edit/:name/:day/:title', checkOwn);
    app.get('/edit/:name/:day/:title', function (req, res) {
        var currentUser = req.session.user;
        var name = currentUser.name;
        var day = req.params.day;
        var title = req.params.title;
        var postOb = new Post(null, null, null,null);
        postOb.edit(name, day, title, function (err, post) {
            if (err) {
                req.flash('error', err);
                return res.redirect('back');
            }
            var info = {
                title: '编辑',
                post: post,
                user: currentUser,
                success: req.flash('success').toString(),
                error: req.flash('error').toString()
            }
            res.render('edit', info);
        })
    });
    app.post('/edit/:name/:day/:title', function (req, res) {
        var currentUser = req.session.user;
        var postOb = new Post(null, null, null,null);
        var name = currentUser.name;
        var day = req.params.day;
        var title = req.params.title.toString();
        var post = req.body.post;
        var url = encodeURI('/u/' + name + '/' + day + '/' + title);
        postOb.update(name, day, title, post, function (err) {
            if (err) {
                req.flash('error', err);
                return res.redirect(url);
            }
            req.flash('success', '修改成功');
            res.redirect(url);
        })
    });

    // 删除文章
    app.get('/remove/:name/:day/:title', checkLogin);
    app.get('/remove/:name/:day/:title', checkOwn);
    app.get('/remove/:name/:day/:title', function (req, res) {
        var name = req.params.name;
        var day = req.params.day;
        var title = req.params.title;
        var postOb = new Post(null, null, null,null);
        postOb.remove(name, day, title, function (err) {
            if (err) {
                req.flash('error', err);
                return res.redirect('back');
            } else {
                req.flash('success', '删除成功');
                res.redirect('/');
            }
        })
    });
    // 退出登录
    app.get('/logout', checkLogin);
    app.get('/logout', function (req, res) {
        req.session.user = null;
        req.flash('success', '登出成功');
        return res.redirect('/');
    });
};

// 检测是否登录
function checkLogin(req, res, next) {
    if (!req.session.user) {
        req.flash('error', '未登录');
        return res.redirect('/login');
    }
    next();
}

// 检测文章是否当前用户拥有
function checkOwn(req, res, next) {
    if (req.session.user.name != req.params.name) {
        req.flash('error', '非拥有用户不可修改');
        return res.redirect('back');
    }
    next();
}

// 没有登录继续执行
function checkNotLogin(req, res, next) {
    if (req.session.user) {
        req.flash('error', '已登录');
        return res.redirect('back');
    }
    next();
}

//上传后处理
function afterUpload(req, res, next) {
    if (req.files) {
        for (var i in req.files) {
            console.log(req.files[i]);
        }
        req.flash('success', '文件上传成功!');
        return res.redirect('/upload');
    }
    next();
}
