let Ytica = {
    YTICA_EXTENSION_ID: 'nipdcehjeimgkcbdikkmijdgeaoilcfg'
};

(function() {
    let YticaCBCounter = 0;
    let YticaCB = {};
    let YTICA_ORIGIN = 'https://assets.ytica.com'
    let YTICA_BRIDGE_URL = 'https://assets.ytica.com/extension/chrome/ytica-bridge.html';

    function bridge() {
        return YTICA_BRIDGE_URL + '#' + Ytica.YTICA_EXTENSION_ID;
    }

    function call_ytica_extension(action, args, cb) {
        let fr = document.createElement("iframe");
        fr.style.display = 'none';
        fr.src = bridge();
        YticaCBCounter += 1;
        YticaCB[YticaCBCounter] = {
            iframe: fr,
            cb: cb
        };
        fr.onload = function() {
            fr.contentWindow.postMessage({
                action: action,
                args: args,
                cbid: YticaCBCounter
            }, "*");
        }
        document.body.appendChild(fr);
    }

    Ytica.set_external_agent_id = function(id) {
        call_ytica_extension('set_id', { external_agent_id: id }, null);
    }

    window.addEventListener("message", function(e) {
        try {
            if (e.origin != YTICA_ORIGIN) return;
            let item = YticaCB[e.data.request.cbid];
            if (item === undefined) {
                return;
            }
            document.body.removeChild(item.iframe);
            delete YticaCB[e.data.request.cbid];
        } catch(err) {
            console.error(err);
        }
    }, false);
})();
