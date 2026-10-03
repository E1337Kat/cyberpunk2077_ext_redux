import util from "util";
import * as fs from "fs";
import * as fsAsync from "fs/promises";
import {
  Buffer,
} from "buffer";
import {
  flow,
  pipe,
} from "fp-ts/lib/function";
import {
  TaskEither,
  tryCatch,
  map as mapTE,
} from "fp-ts/lib/TaskEither";
import {
  map,
} from "fp-ts/lib/ReadonlyArray";


// Original implementation courtesy of Seberoth
class ArchiveReader {
  _read: any = util.promisify(fs.read);

  ReadFileList = async (path: string): Promise<bigint[]> => {
    const handle = await fsAsync.open(path, `r`);

    const indexPosition = await this.ReadInt64(handle, 8);
    const fileCount = await this.ReadInt32(handle, indexPosition + BigInt(16));

    const result:bigint[] = [];
    for (let i = 0; i < fileCount; i += 1) {
      // can't validate right now, should be right
      const position = indexPosition + (BigInt(28) + (BigInt(i) * BigInt(56)));
      // eslint-disable-next-line no-await-in-loop
      const hash = await this.ReadUInt64(handle, position);

      result.push(hash);
    }

    handle.close();

    return result;
  };

  ReadInt32 = async (handle: fsAsync.FileHandle, position: number | bigint): Promise<number> => {
    const data = await this.ReadBytes(handle, position, 8);

    return data.readInt32LE();
  };

  ReadInt64 = async (handle: fsAsync.FileHandle, position: number | bigint): Promise<bigint> => {
    const data = await this.ReadBytes(handle, position, 8);

    return data.readBigInt64LE();
  };

  ReadUInt64 = async (handle: fsAsync.FileHandle, position: number | bigint): Promise<bigint> => {
    const data = await this.ReadBytes(handle, position, 8);

    return data.readBigUInt64LE();
  };

  ReadBytes = async (handle: fsAsync.FileHandle, position: number | bigint, length: number): Promise<Buffer> => {
    const buffer = Buffer.alloc(length);

    // fs accepts bigint for position, fs/promises does not -.-
    // eslint-disable-next-line no-underscore-dangle
    const ret = await this._read(handle.fd, buffer, 0, length, position);

    return ret.buffer;
  };
}


export const extractAssetPathHashesUsedByArchive = (archivePath: string): TaskEither<Error, readonly string[]> =>
  pipe(
    tryCatch(
      () => new ArchiveReader().ReadFileList(archivePath),
      (err) => new Error(`Error extracting asset paths from ${archivePath}: ${err}`),
    ),
    mapTE(flow(
      map((hash) => hash.toString(16)),
    )),
  );
