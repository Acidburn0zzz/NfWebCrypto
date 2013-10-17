function Test(name, test) {
    this.name = name;
    this.startTime = null;
    this.endTime = null;
    this.result = null;
    this.row = null;
    this.currentIteration = 0;
    this.maxIterations = 20;

    this.run = function() {
        
        if (this.currentIteration == 0) {
            // Note the start time
            this.startTime = window.performance.now();
        }
        // Run the test
        try {
            //console.log(this.name + " " + this.currentIteration);
            test.call(this);
        } catch (e) {
            console.log(e);
            console.log(e.stack);
            this.complete(false);
        }
    };

    this.memcmp_complete = function(x, y) {
        var passfail = util.memcmp(x, y);
        if (!passfail) {
            console.log("expected: " + util.abv2hex(x));
            console.log("     got: " + util.abv2hex(y));
        }
        this.complete(passfail);
    };

    this.complete = function(result) {
        if ( (this.name != "LoadPlugin") && (this.currentIteration++ < this.maxIterations-1 )) {
            // run the test again
            this.run();
        } else {
            // Note the end time
            this.endTime = window.performance.now();
            // Set result
            this.result = result;
            // Re-draw the row
            this.draw();

            this.currentIteration = 0;
            
            if (this.oncomplete) {
                this.oncomplete();
            }
        }
    };

    this.setRow = function(id) {
        this.row = document.getElementById(id).getElementsByTagName("td");
    };

    this.draw = function() {
        var testTime = 0;
        if (!this.row) return;
        
        // Print the name of the test
        if (this.name) {
            this.row[0].innerHTML = this.name;
        } else {
            this.row[0] = "";
        }

        // Print the result of the test
        if (this.result == true) {
            this.row[1].className = "pass";
            this.row[1].innerHTML = "PASS";
        } else if (this.result == false) {
            this.row[1].className = "fail";
            this.row[1].innerHTML = "FAIL";
        } else {
            this.row[1].innerHTML = "";
        }

        if (this.result == true) {
            // Print the elapsed time, if known
            if (this.startTime &&  this.endTime) {
                testTime = this.endTime - this.startTime;
                if (this.name != "Load Plugin") {
                    testTime /= this.maxIterations;
                }
                this.row[2].innerHTML = testTime.toFixed(0) + " ms";
            } else {
                this.row[2].innerHTML = "";
            }
        }
    };
}

var TestArray = {
    tests: [],
    table: null,
    passSpan: null,
    failSpan: null,
    pendingSpan: null,
    pass: 0,
    fail: 0,
    pending: 0,
    currTest: 0,

    addTest: function(name, testFn) {
        // Give it a reference to the array
        var test = new Test(name, testFn);
        test.ta = this;
        // Add test to tests
        this.tests.push(test);
    },

    updateSummary: function() {
        this.pass = this.fail = this.pending = 0;
        for (var i=0; i<this.tests.length; ++i) {
            if (this.tests[i].result == true)  this.pass++;
            if (this.tests[i].result == false) this.fail++;
            if (this.tests[i].result == null)  this.pending++;
        }
        this.passSpan.innerHTML = this.pass;
        this.failSpan.innerHTML = this.fail;
        this.pendingSpan.innerHTML = this.pending;
    },

    load: function() {
        // Grab reference to table and summary numbers
        this.table = document.getElementById("results");
        this.passSpan = document.getElementById("passN");
        this.failSpan = document.getElementById("failN");
        this.pendingSpan = document.getElementById("pendingN");

        // Populate everything initially
        this.updateSummary();
        for (var i=0; i<this.tests.length; ++i) {
            var tr = document.createElement("tr");
            tr.id = "test" + i;
            tr.appendChild(document.createElement("td"));
            tr.appendChild(document.createElement("td"));
            tr.appendChild(document.createElement("td"));
            this.table.appendChild(tr);
            this.tests[i].setRow(tr.id);
            this.tests[i].draw();
        }
    },

    run: function() {
        this.currTest = 0;
        this.runNextTest();
    },

    runNextTest: function() {
        this.updateSummary();
        var i = this.currTest++;
        if (i >= this.tests.length) return;
        
        var self = this;
        this.tests[i].oncomplete = function() {
            self.runNextTest();
        }
        this.tests[i].run();
    }
}

if (window.addEventListener) {
    window.addEventListener("load", function() { TestArray.load(); } );
} else {
    window.attachEvent("onload", function() { TestArray.load(); } );
}


function start() {
    TestArray.run();
    document.getElementById("start").style.display = "none";
    document.getElementById("resultDiv").style.display = "inline";
}

