/**
* Author: austynmahoney (https://github.com/austynmahoney)
*/
var selectedExportOptions = {};

var buExportOptions = {};

var androidExportOptions = [
    {
        name: "mdpi",
        scaleFactor: 50,
        type: "android"
    },
    {
        name: "hdpi",
        scaleFactor: 75,
        type: "android"
    },
    {
        name: "xhdpi",
        scaleFactor: 100,
        type: "android"
    },
    {
        name: "xxhdpi",
        scaleFactor: 150,
        type: "android"
    },
    {
        name: "xxxhdpi",
        scaleFactor: 200,
        type: "android"
    }
];

var iosExportOptions = [
    {
        name: "",
        scaleFactor: 50,
        type: "ios"
    },
    {
        name: "@2x",
        scaleFactor: 100,
        type: "ios"
    },
    {
        name: "@3x",
        scaleFactor: 150,
        type: "ios"
    }
];

var allExportOptions = androidExportOptions.concat(iosExportOptions);

var androidDropdownPosition = 2;
var iosDropdownPosition = 1;

var document = app.activeDocument;
var folder = new Folder(document.path);

if(document && folder) {
    var dialog = new Window("dialog","Select export sizes");

    var tabbedpanel = dialog.add("tabbedpanel");
    var topTab = tabbedpanel.add("tab", undefined, "Top");
    var propertyTab = tabbedpanel.add("tab", undefined, "Property");

    // -------------------------------- tab:Top --------------------------------
    var allSelectCheckbox = topTab.add("checkbox", undefined, "\u00A0" + "Export All sizes (Android and iOS)");

    var osGroup = topTab.add("group");
    osGroup.alignChildren = "top";
    var androidCheckboxes = createSelectionPanel("Android", androidExportOptions, osGroup);
    var iosCheckboxes = createSelectionPanel("iOS", iosExportOptions, osGroup);

    var baseGroup = topTab.add("group");
    var basePulldownMenus = createPulldownPanel("Select base sizes", baseGroup);

    // ----------------------------- tab:Property ------------------------------
    var pathPanel = propertyTab.add("panel", undefined, "Export path");
    pathPanel.alignChildren = "left";
    var pathGroup = pathPanel.add("group");
    var showPathButton = pathGroup.add("button", undefined, "show");
    var changePathButton = pathGroup.add("button", undefined, "...");

    // -------------------------------------------------------------------------
    var buttonGroup = dialog.add("group");
    var cancelButton = buttonGroup.add("button", undefined, "Cancel");
    var okButton = buttonGroup.add("button", undefined, "Export");

    allSelectCheckbox.onClick = function() {
        if(this.value) {
            backupExportOptions(); // backup: selectedExportOptions -> buExportOptions
            for(var i=0; i < allExportOptions.length; i++) {
                var item = allExportOptions[i];
                selectedExportOptions[item.name] = item;
            }
            androidCheckboxes.enabled = false;
            iosCheckboxes.enabled = false;
        } else {
            restoreExportOptions(); // restore: buExportOptions -> selectedExportOptions
            androidCheckboxes.enabled = true;
            iosCheckboxes.enabled = true;
            //dialog.update();
        }
    };
    showPathButton.onClick = function() {
        alert("Export path is\n"+folder.fsName);
    };
    changePathButton.onClick = function() {
        var tmpfolder = Folder.selectDialog("Select export directory");
        if(tmpfolder) {
            folder = tmpfolder;
        } else {
            //alert("Cannot change current path.");
        }
    };
    okButton.onClick = function() {
        var length = 0;
        for(var i in selectedExportOptions) length++;
        if(length === 0) {
            alert("Please select export sizes.");
        } else {
            this.parent.parent.close();

            var cnt = 0;
            var progressDialog = new Window("palette", "Export files");
            var statusGroup = progressDialog.add("group");
            var completed = statusGroup.add("statictext", undefined, "exporting process: " + cnt + " of " + length);
            var progressbar = progressDialog.add("Progressbar", undefined, 0, length);
            progressbar.preferredSize = [300, 20];
            progressDialog.show();

            for (var key in selectedExportOptions) {
                if (selectedExportOptions.hasOwnProperty(key)) {
                    var item = selectedExportOptions[key];
                    var scalecoefficient = createScaleCoefficient(item.type);
                    exportToFile(item.scaleFactor * scalecoefficient, item.name, item.type);
                }

                progressbar.value = cnt;
                completed.text = "exporting process: " + cnt + " of " + length;
                progressDialog.update();
                cnt++;

            }
            progressDialog.close();
        }
    };
    cancelButton.onClick = function () {
        this.parent.parent.close();
    };

    dialog.show();
}

function exportToFile(scaleFactor, resIdentifier, os) {
    var i, ab, file, options, expFolder;
    if(os === "android")
        expFolder = new Folder(folder.fsName + "/drawable-" + resIdentifier);
    else if(os === "ios")
        expFolder = new Folder(folder.fsName + "/iOS");

    if (!expFolder.exists) {
        expFolder.create();
    }

    for (i = document.artboards.length - 1; i >= 0; i--) {
        document.artboards.setActiveArtboardIndex(i);
        ab = document.artboards[i];
        
        if(os === "android")
            file = new File(expFolder.fsName + "/" + ab.name + ".png");
        else if(os === "ios")
            file = new File(expFolder.fsName + "/" + ab.name + resIdentifier + ".png");
            
        options = new ExportOptionsPNG24();
        options.transparency = true;
        options.artBoardClipping = true;
        options.antiAliasing = true;
        options.verticalScale = scaleFactor;
        options.horizontalScale = scaleFactor;

        document.exportFile(file, ExportType.PNG24, options);
    }
};

function createSelectionPanel(name, array, parent) {
    var panel = parent.add("panel", undefined, name);
    panel.alignChildren = "left";
    for(var i = 0; i < array.length;  i++) {
        var cb = panel.add("checkbox", undefined, "\u00A0" + array[i].name);
        cb.item = array[i];
        cb.onClick = function() {
            if(this.value) {
                selectedExportOptions[this.item.name] = this.item;
                //alert("added " + this.item.name);
            } else {
                delete selectedExportOptions[this.item.name];
                //alert("deleted " + this.item.name);
            }
        };
    }
    return panel;
};

function createPulldownPanel(name, parent) {
    var panel = parent.add("panel", undefined, name);
    panel.alignChildren = "left";
    var androidSizes = new Array();
    var iosSizes = new Array();

    for(var i=0; i < androidExportOptions.length; i++) {
        androidSizes.push(androidExportOptions[i].name);
    }
    for(var i=0; i < iosExportOptions.length; i++) {
        var name = iosExportOptions[i].name;
        if(name === "") name = "@1x"; 
        iosSizes.push(name);
    }

    var androidSelectionGroup = panel.add("group");
    var androidTv = androidSelectionGroup.add("statictext", undefined, "Android Scale -");
    var androidDdl = androidSelectionGroup.add("dropdownlist", undefined, androidSizes);
    androidDdl.selection = androidDropdownPosition;

    var iosSelectionGroup = panel.add("group");
    var iosTv = iosSelectionGroup.add("statictext", undefined, "iOS Scale -");
    var iosDdl = iosSelectionGroup.add("dropdownlist", undefined, iosSizes);
    iosDdl.selection = iosDropdownPosition;

    androidDdl.onChange = function() {
        //alert("android dropdownlist position - "+androidDdl.selection);
        androidDropdownPosition = androidDdl.selection;
    };
    iosDdl.onChange = function() {
        //alert("ios dropdownlist position - "+iosDdl.selection);
        iosDropdownPosition = iosDdl.selection;
    };

    return panel;
};

function backupExportOptions() {
    buExportOptions = clone(selectedExportOptions);
};

function restoreExportOptions() {
    selectedExportOptions = clone(buExportOptions);
};

function clone(from) {
    to = {};
    for(var i in from) {
        to[i] = from[i];
    }
    return to;
};

function createScaleCoefficient(os) {
    var position;
    var exportOptions;
    if(os === "android") {
        position = androidDropdownPosition;
        exportOptions = androidExportOptions;
    } else if(os === "ios") {
        position = iosDropdownPosition;
        exportOptions = iosExportOptions;
    }
    var coefficient;
    for(var i=0; i < exportOptions.length; i++) {
        if(i == position) {
            coefficient = exportOptions[i].scaleFactor;
        }
    }
    coefficient = 100 / coefficient;
    return coefficient;
};

