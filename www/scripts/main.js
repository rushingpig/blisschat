window.onload = function () {
    var blisschat = new BlissChat();
    blisschat.init();
};

var BlissChat = function(){
    this.socket = null;
};

BlissChat.prototype = {
    init : function () {
        var that = this;
        this.socket = io.connect();
        this.socket.on('connect',function(){
            document.getElementById('info').textContent = '给自己取个狂拽酷炫叼炸天的昵称吧 :)';
            document.getElementById('nickWrapper').style.display = 'block';
            document.getElementById('nicknameInput').focus();
        });

        document.getElementById('loginBtn').addEventListener('click',function(){
            var nickname = document.getElementById('nicknameInput').value;
            if(nickname.trim().length != 0){
                that.socket.emit('login',nickname);
            }else {
                document.getElementById('nicknameInput').focus();
            }
        });

        this.socket.on('loginSuccess',function () {
            document.title = 'BlissChat | ' + document.getElementById('nicknameInput').value;
            document.getElementById('loginWrapper').style.display = 'none';
            document.getElementById('messageInput').focus();
        });

        this.socket.on('system',function (nickname,userCount,type) {
            var msg = (nickname ? nickname : '游客盆友') + (type == 'login' ? ' 加入聊天室' : ' 离开聊天室');
            // var p = document.createElement('p');
            // p.textContent = msg;
            // document.getElementById('historyMsg').appendChild(p);
            that._displayNewMsg('system ', msg, 'red');
            document.getElementById('status').textContent = userCount + (userCount > 1 ? 'users' : ' user') + ' 在线';
        });

        this.socket.on('nickExisted',function () {
            document.getElementById('info').textContent = '该马甲被套用了,换个马甲。。。';
        });

        this.socket.on('loginSuccess',function () {
            document.title = 'BlissChat | ' + document.getElementById('nicknameInput').value;
            document.getElementById('loginWrapper').style.display = 'none';
            document.getElementById('messageInput').focus();
        });

        this.socket.on('newMsg', function(user, msg) {
            that._displayNewMsg(user, msg);
        });

        document.getElementById('sendImage').addEventListener('change', function() {
            //检查是否有文件被选中
            if (this.files.length != 0) {
                //获取文件并用FileReader进行读取
                var file = this.files[0],
                    reader = new FileReader();
                if (!reader) {
                    that._displayNewMsg('system', '您的浏览器不支持文件读取。。。', 'red');
                    this.value = '';
                    return;
                };
                reader.onload = function(e) {
                    //读取成功，显示到页面并发送到服务器
                    this.value = '';
                    that.socket.emit('img', e.target.result);
                    that._displayImage('自己', e.target.result);
                };
                reader.readAsDataURL(file);
            }
        }, false);

        this.socket.on('newImg', function(user, img) {
            that._displayImage(user, img);
        });
        this._initialEmoji();
        document.getElementById('emoji').addEventListener('click', function(e) {
            var emojiwrapper = document.getElementById('emojiWrapper');
            emojiwrapper.style.display = 'block';
            e.stopPropagation();
        }, false);
        document.body.addEventListener('click', function(e) {
            var emojiwrapper = document.getElementById('emojiWrapper');
            if (e.target != emojiwrapper) {
                emojiwrapper.style.display = 'none';
            }
        });

        document.getElementById('emojiWrapper').addEventListener('click', function(e) {
            //获取被点击的表情
            var target = e.target;
            if (target.nodeName.toLowerCase() == 'img') {
                var messageInput = document.getElementById('messageInput');
                messageInput.focus();
                messageInput.value = messageInput.value + '[emoji:' + target.title + ']';
            }
        }, false);

        document.getElementById('sendBtn').addEventListener('click', function() {
            var messageInput = document.getElementById('messageInput'),
                msg = messageInput.value,
                //获取颜色值
                color = document.getElementById('colorStyle').value;
            messageInput.value = '';
            messageInput.focus();
            if (msg.trim().length != 0) {
                //显示和发送时带上颜色值参数
                that.socket.emit('postMsg', msg, color);
                that._displayNewMsg('自己', msg, color);
            }
        }, false);

        document.getElementById('nicknameInput').addEventListener('keyup', function(e) {
            if (e.keyCode == 13) {
                var nickName = document.getElementById('nicknameInput').value;
                if (nickName.trim().length != 0) {
                    that.socket.emit('login', nickName);
                }
            }
        }, false);
        document.getElementById('messageInput').addEventListener('keyup', function(e) {
            var messageInput = document.getElementById('messageInput'),
                msg = messageInput.value,
                color = document.getElementById('colorStyle').value;
            if (e.keyCode == 13 && msg.trim().length != 0) {
                messageInput.value = '';
                that.socket.emit('postMsg', msg, color);
                that._displayNewMsg('自己', msg, color);
            }
        }, false);

        document.getElementById('clearBtn').addEventListener('click',function(e){
            var historyMsg = document.getElementById('historyMsg');
            historyMsg.textContent = '';
        },false);

    },
    _displayImage: function(user, imgData, color) {
        var container = document.getElementById('historyMsg'),
            msgToDisplay = document.createElement('p'),
            date = new Date().toTimeString().substr(0, 8);
        msgToDisplay.style.color = color || '#000';
        msgToDisplay.innerHTML = user + '<span class="timespan">(' + date + '): </span> <br/>' + '<a href="' + imgData + '" target="_blank"><img src="' + imgData + '"/></a>';
        container.appendChild(msgToDisplay);
        container.scrollTop = container.scrollHeight;
    },
    _initialEmoji: function() {
        var emojiContainer = document.getElementById('emojiWrapper'),
            docFragment = document.createDocumentFragment();
        for (var i = 69; i > 0; i--) {
            var emojiItem = document.createElement('img');
            emojiItem.src = '../content/emoji/' + i + '.gif';
            emojiItem.title = i;
            docFragment.appendChild(emojiItem);
        }
        emojiContainer.appendChild(docFragment);
    },
    _displayNewMsg: function(user, msg, color) {
        var container = document.getElementById('historyMsg'),
            msgToDisplay = document.createElement('p'),
            date = new Date().toTimeString().substr(0, 8),
            //将消息中的表情转换为图片
            msg = this._showEmoji(msg);
        msgToDisplay.style.color = color || '#000';
        msgToDisplay.innerHTML = user + '<span class="timespan">(' + date + '): </span>' + msg;
        container.appendChild(msgToDisplay);
        container.scrollTop = container.scrollHeight;
    },
    _showEmoji: function(msg) {
        var match, result = msg,
            reg = /\[emoji:\d+\]/g,
            emojiIndex,
            totalEmojiNum = document.getElementById('emojiWrapper').children.length;
        while (match = reg.exec(msg)) {
            emojiIndex = match[0].slice(7, -1);
            if (emojiIndex > totalEmojiNum) {
                result = result.replace(match[0], '[X]');
            } else {
                result = result.replace(match[0], '<img class="emoji" src="../content/emoji/' + emojiIndex + '.gif" />');
            }
        }
        return result;
    }
};



