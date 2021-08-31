// Editor shim for a bug fixed in our fork of the Cocos Creator web engine
// See https://git.corp.bigfishgames.com/self-aware/cocos2d-creator/commit/9b8b5be680e6805b54a32f37b39edd5dafb7dfe9

/* global
	spine
*/

var proto = sp._SGSkeleton.WebGLRenderCmd.prototype;

proto._uploadRegionAttachmentData = function(attachment, slot, premultipliedAlpha, f32buffer, ui32buffer, vertexDataOffset) {
    // the vertices in format:
    // [
    //   X1, Y1, C1R, C1G, C1B, C1A, U1, V1,    // bottom left
    //   X2, Y2, C2R, C2G, C2B, C2A, U2, V2,    // top left
    //   X3, Y3, C3R, C3G, C3B, C3A, U3, V3,    // top right
    //   X4, Y4, C4R, C4G, C4B, C4A, U4, V4     // bottom right
    // ]
    //
    var nodeColor = this._displayedColor;
    var nodeR = nodeColor.r,
        nodeG = nodeColor.g,
        nodeB = nodeColor.b,
        nodeA = this._displayedOpacity;
    if (premultipliedAlpha) {
        nodeR *= nodeA / 255;
        nodeG *= nodeA / 255;
        nodeB *= nodeA / 255;
    }
    var vertices = attachment.updateWorldVertices(slot, premultipliedAlpha);
    var wt = this._worldTransform,
        wa = wt.a, wb = wt.b, wc = wt.c, wd = wt.d,
        wx = wt.tx, wy = wt.ty,
        z = this._node.vertexZ;

    var offset = vertexDataOffset;
    // generate 6 vertices data (two triangles) from the quad vertices
    // using two angles : (0, 1, 2) & (0, 2, 3)
    for (var i = 0; i < 6; i++) {
        var srcIdx = i < 4 ? i % 3 : i - 2;
        var vx = vertices[srcIdx * 8],
            vy = vertices[srcIdx * 8 + 1];
        var x = vx * wa + vy * wc + wx,
            y = vx * wb + vy * wd + wy;
        var r = vertices[srcIdx * 8 + 2] * nodeR,
            g = vertices[srcIdx * 8 + 3] * nodeG,
            b = vertices[srcIdx * 8 + 4] * nodeB,
            a = vertices[srcIdx * 8 + 5] * nodeA;
        var color = ((a<<24) | (b<<16) | (g<<8) | r);
        f32buffer[offset] = x;
        f32buffer[offset + 1] = y;
        f32buffer[offset + 2] = z;
        ui32buffer[offset + 3] = color;
        f32buffer[offset + 4] = vertices[srcIdx * 8 + 6];
        f32buffer[offset + 5] = vertices[srcIdx * 8 + 7];
        offset += 6;
    }

    if (this._node._debugSlots) {
        // return the quad points info if debug slot enabled
        var VERTEX = spine.RegionAttachment;
        return [
            cc.p(vertices[VERTEX.X1], vertices[VERTEX.Y1]),
            cc.p(vertices[VERTEX.X2], vertices[VERTEX.Y2]),
            cc.p(vertices[VERTEX.X3], vertices[VERTEX.Y3]),
            cc.p(vertices[VERTEX.X4], vertices[VERTEX.Y4])
        ];
    }
};

proto._uploadMeshAttachmentData = function(attachment, slot, premultipliedAlpha, f32buffer, ui32buffer, vertexDataOffset) {
    var wt = this._worldTransform,
        wa = wt.a, wb = wt.b, wc = wt.c, wd = wt.d,
        wx = wt.tx, wy = wt.ty,
        z = this._node.vertexZ;
    // get the vertex data
    var vertices = attachment.updateWorldVertices(slot, premultipliedAlpha);
    var offset = vertexDataOffset;
    var nodeColor = this._displayedColor;
    var nodeR = nodeColor.r,
        nodeG = nodeColor.g,
        nodeB = nodeColor.b,
        nodeA = this._displayedOpacity;
    if (premultipliedAlpha) {
        nodeR *= nodeA / 255;
        nodeG *= nodeA / 255;
        nodeB *= nodeA / 255;
    }
    for (var i = 0, n = vertices.length; i < n; i += 8) {
        var vx = vertices[i],
            vy = vertices[i + 1];
        var x = vx * wa + vy * wc + wx,
            y = vx * wb + vy * wd + wy;
        var r = vertices[i + 2] * nodeR,
            g = vertices[i + 3] * nodeG,
            b = vertices[i + 4] * nodeB,
            a = vertices[i + 5] * nodeA;
        var color = ((a<<24) | (b<<16) | (g<<8) | r);

        f32buffer[offset] = x;
        f32buffer[offset + 1] = y;
        f32buffer[offset + 2] = z;
        ui32buffer[offset + 3] = color;
        f32buffer[offset + 4] = vertices[i + 6];
        f32buffer[offset + 5] = vertices[i + 7];
        offset += 6;
    }
};