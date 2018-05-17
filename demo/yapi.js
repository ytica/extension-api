let Ytica = {
    YTICA_EXTENSION_ID: 'nipdcehjeimgkcbdikkmijdgeaoilcfg'
};

Ytica.init = function() {
    let YticaCBCounter = 0;
    let YticaCB = {};
    let YTICA_ORIGIN = 'https://assets.ytica.com'
    let YTICA_BRIDGE_URL = 'https://assets.ytica.com/extension/chrome/ytica-bridge.html';
    let BRIDGE_ID = 'ytica-extension-bridge';
    let ready = false;
    let creating = false;

    function bridge() {
        return YTICA_BRIDGE_URL + '#' + Ytica.YTICA_EXTENSION_ID;
    }

    function create_bridge_iframe(cb) {
        if (creating) {
            setTimeout(cb, 100);
            return;
        }
        creating = true;
        let fr = document.createElement("iframe");
        fr.style.display = 'none';
        fr.onload = function() {
            console.log("ready");
            ready = true;
            creating = false;
            cb();
        }
        fr.id = BRIDGE_ID;
        fr.src = bridge();
        document.body.appendChild(fr);
    }

    function call_ytica_extension(action, args, cb) {
        let fr = document.getElementById(BRIDGE_ID);
        if (fr == null || !ready) {
            ready = false;
            create_bridge_iframe(function() {
                call_ytica_extension(action, args, cb);
            });
            return;
        }
        YticaCBCounter += 1;
        YticaCB[YticaCBCounter] = {
            cb: cb
        };
        fr.contentWindow.postMessage({
            action: action,
            args: args,
            cbid: YticaCBCounter
        }, "*");
    }

    Ytica.setExternalAgentIdOrIgnore = function(id) {
        call_ytica_extension('set_id', { external_agent_id: id }, function(res) {
            if (!res.success) {
                console.error("Ytica.setExternalAgentIdOrIgnore failed", res);
            }
        });
    }

    Ytica.set_external_agent_id = Ytica.setExternalAgentIdOrIgnore;

    Ytica.setExternalAgentIdOrInstall = function(accountId, exId, cb) {
        call_ytica_extension('set_id', { external_agent_id: exId },
            function(res) {
                if (!res.success && res.code == 404) {
                    console.log(res);
                    let redir = 'https://app.ytica.com/extension/install?account_id=' +
                        encodeURI(accountId) + '&external_agent_id=' + encodeURI(exId) +
                        '&agent_id=';
                    console.log('install: ' + redir);
                    if (cb) {
                        cb(redir);
                    } else {
                        window.open(redir, "Ytica extension install");
                    }
                    return;
                }

                if (!res.success) {
                    console.error("Ytica.setExternalAgentIdOrInstall failed", res);
                    return;
                }
            }
        );
    };

    window.addEventListener("message", function(e) {
        try {
            if (e.origin != YTICA_ORIGIN) return;
            let item = YticaCB[e.data.request.cbid];
            if (item === undefined) {
                console.log("! missing: " + e.data.request.cbid)
                return;
            }
            if (item.cb) {
                item.cb(e.data.response);
            }
            delete YticaCB[e.data.request.cbid];
        } catch(err) {
            console.error(err);
        }
    }, false);
};
