import json
from flask import Flask, render_template, send_from_directory, abort, redirect, url_for, request
from gevent.wsgi import WSGIServer
from pymongo import MongoClient
from settings import *
from basic_auth import *

app = Flask(__name__)
app.debug = True

content = {
        "image": DEF_BG
        }

@app.route("/")
def home():
    content = {
            "home": True,
            "image": DEF_BG,
            "items": []
            }
    query_filter = {
            "_id": 0,
            "post_id": 1,
            "image": 1,
            "title": 1,
            "summary": 1,
            "order": 1
            }
    with MongoClient() as client:
        for result in client[MONGO_DB][MONGO_COLL].find({}, query_filter):
            content["items"].append(result)
    content["items"] = sorted(content["items"], key=lambda x: x["order"])
    return render_template("home.html", content=content)

@app.route("/post/<post_id>")
def post(post_id):
    results = []
    query_filter = { "_id": 0 }
    with MongoClient() as client:
        for result in client[MONGO_DB][MONGO_COLL].find({"post_id": post_id}, query_filter):
            results.append(result)
    if len(results) != 1:
        abort(404)
    return render_template("post.html", content=results[0])

@app.route("/photos/<path:filename>")
def photos(filename):
    return send_from_directory(IMG_DIR, filename)

@app.route("/admin")
@requires_auth
def admin():
    temp = []
    content["items"] = []
    with MongoClient() as client:
        for result in client[MONGO_DB][MONGO_COLL].find({}, {"_id": 0}):
            temp.append(result)
    temp = sorted(temp, key=lambda x: x["order"])
    for item in temp:
        content["items"].append(json.dumps(item, indent=4))
    return render_template("admin.html", content=content)

@app.route("/update", methods=["GET", "POST"])
@requires_auth
def update_data():
    if request.method == "POST":
        item = json.loads(request.form["item"])
        with MongoClient() as client:
            client[MONGO_DB][MONGO_COLL].update({"post_id": item["post_id"]}, {"$set": item})
    return redirect(url_for("admin"))

@app.errorhandler(404)
def page_not_found(error):
    return render_template("404.html", content=content), 404

http_server = WSGIServer(("", SERVER_PORT), app)
http_server.serve_forever()
