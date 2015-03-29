document.write('\
	<link rel="stylesheet" type="text/css" href="styles.css">\
	<title>XyPhoGR&#39;s Github Page</title>\
\
	<header class="titleheader">\
		<div class="titletext">XyPhoGR&#39;s Github Page</div>\
		<div class="navbar">\
			<nav class="dropdownmenu">\
				<ul>\
					<li><a href="./index.html">Home</a></li>\
					<!-- no projects to display yet :( -->\
					<!--<li><a href="./projects.html">Projects</a>\
						<ul id="submenu">\
							<li><a href="./test.html">Test</a></li>\
						</ul>\
					</li>-->\
					<li><a href="#">Other Sites</a>\
						<ul id="submenu">\
							<li><a href="https://twitter.com/Ralitski" target="_blank">Twitter</a></li>\
							<!-- oh jeez this breaks skype...how do -->\
							<!--<li><a href="skype:ralitski?userinfo">Skype</a></li>-->\
							<li><a href="http://xyphogr.tumblr.com/" target="_blank">Tumblr</a></li>\
						</ul>\
					</li>\
					<!--<li><a href="./about.html">About</a></li>-->\
				</ul>\
			</nav>\
		</div>\
	</header>\
	<!-- adds extra stuff so page content isn\'t written over-->\
	<header class="titleheader" style="position:static;">\
	</header>\
\
');
function embedVid(vid) {
	document.write('<div class="mediabox" style="width:420px;height:315px;">\
			<iframe width="420" height="315" src="http://www.youtube.com/embed/' + vid + '" frameborder="0" allowfullscreen></iframe>\
		</div><br/>');
}
function embedImg(img, w, h) {
	document.write('<div class="mediabox" style="width:' + w + 'px;height:' + h + 'px;">\
			<img src="' + img + '"/>\
		</div><br/>');
}
/*
	<h1>\
		<div class="header">XyPhoGR&#39;s Github Page</div><div style="float:right;margin-left:15px;margin-right:15px;font: bold 16px/20px sans-serif;padding: 10px 0px;">-ralitski</div>\
\
<!-- the CSS for the following navbar was written by [unknown] and edited by Dhanushbadge on codepen.io (then edited more by ral) -->\
<!--\
Copyright (c) 2015 by Dhanush Badge (http://codepen.io/dhanushbadge/pen/olsvi)\
\
Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:\
\
The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.\
\
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.\
-->\
\
		<div class="navbar">\
			<nav class="dropdownmenu">\
				<ul>\
					<li><a href="./index.html">Home</a></li>\
					<!-- no projects to display yet :( -->\
					<!--<li><a href="./projects.html">Projects</a>\
						<ul id="submenu">\
							<li><a href="./test.html">Test</a></li>\
						</ul>\
					</li>-->\
					<li><a href="#">Other Sites</a>\
						<ul id="submenu">\
							<li><a href="https://twitter.com/Ralitski" target="_blank">Twitter</a></li>\
							<!-- oh jeez this breaks skype...how do -->\
							<!--<li><a href="skype:ralitski?userinfo">Skype</a></li>-->\
							<li><a href="http://xyphogr.tumblr.com/" target="_blank">Tumblr</a></li>\
						</ul>\
					</li>\
					<!--<li><a href="./about.html">About</a></li>-->\
				</ul>\
			</nav>\
		</div>\
	</h1>\
*/