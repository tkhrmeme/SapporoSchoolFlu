#!/usr/local/bin/python
# -*- coding: utf-8 -*-

'''
PDFを保存したテキストファイルを読み込んで整形し，CSV形式に変換してファイルに保存する

PDFファイルは開いて全選択し，copy&pasteでテキストファイルに保存する。

出力例：
City,School,Address,Type,Start,End,Grade,Count
札幌市立,幌西小学校,中央区南10条西17丁目,学級閉鎖,2014/12/03,2014/12/05,２年,32
'''

##
import os
import sys
import csv
import re
from datetime import datetime

annualData = False # 年次データを処理するときはTrue

skipPattern = re.compile(r'掲載|インフル|学校・')

patternDaily = re.compile(r'^(札幌市立)(.*学校)(.*)(学..+閉鎖)([\d\/]+)\(.+\)([\d\/]+)\(.+\)([^\d]*)(\d+)')
patternAnnual = re.compile(r'^(\d*\s)(.*学校)(.*)(学..+閉鎖)(平成2\d年\s*\d*月\s*\d*日\(.+\))(平成2\d年\s*\d*月\s*\d*日\(.+\))(\d年)(\d+)')
patternDate = re.compile(r'平成(2\d)年(\s*\d*)月(\s*\d*)日\(.+\)')


def processData(fout, lineData, annual):
    '''
    連結した行をパターンマッチで要素に分解してCSV出力する
    '''
    
    if annual:
        # 年次データの場合
        m = patternAnnual.match(lineData)
        if m:
            fout.write("札幌市立")      
            fout.write(',' +m.group(2))             #学校名
            fout.write(',' +m.group(3).rstrip(' ')) #住所
            fout.write(',' +m.group(4))             #措置
            
            d = patternDate.match(m.group(5))
            dateStr = "{0:d}/{1:02d}/{2:02d}".format(1988+int(d.group(1)), int(d.group(2)), int(d.group(3)))
            fout.write(',' +dateStr)    #開始
            
            d = patternDate.match(m.group(6))
            dateStr = "{0:d}/{1:02d}/{2:02d}".format(1988+int(d.group(1)), int(d.group(2)), int(d.group(3)))
            fout.write(',' +dateStr)    #終了
            
            fout.write(',' +m.group(7))             #学年
            fout.write(',' +m.group(8))             #人数
            fout.write('\n')
        else:
            print('No match: ' +lineData)
    else:
        # 日次データの場合
        m = patternDaily.match(lineData)
        if m:
            fout.write(m.group(1))      
            fout.write(',' +m.group(2))
            fout.write(',' +m.group(3).rstrip(' '))
            fout.write(',' +m.group(4))
            fout.write(',' +m.group(5))
            fout.write(',' +m.group(6))
            fout.write(',' +m.group(7))
            fout.write(',' +m.group(8))
            fout.write('\n')
        else:
           print('No match: ' +lineData)
    
def mainProcess(fin, fout, annual):
    '''
    複数行に分かれた要素を連結して１行にまとめる
    '''
    data = ''
    patternLineHead = r'^札幌市立'        # １レコードの区切りの行
    if annual:
        patternLineHead = r'^(\d*\s)'    # 通し番号が行先頭

    for line in fin:
        if re.match(patternLineHead, line):
            processData(fout, data, annual)
            data = line.rstrip('\r\n')
        else:
            m = skipPattern.match(line)
            if m:
                print('Skip: ' +line)
            else:
                data += line.rstrip('\r\n') # 行を結合
    if data:
        processData(fout, data, annual)
        
if __name__ == "__main__":
    workPath = os.path.abspath(sys.argv[0])
    
    # 日付と変換済ファイルの対応リスト
    dateFileList = []
    
    dflPath = os.path.join(workPath, 'DateFileList.csv')
    if os.path.isfile(dflPath):
        fp = open(dflPath,'rb')
        reader = csv.reader(fp)
        for row in reader:
            dateFileList.append(row)
        del(dateFileList[0])
        fp.close()
    else:
        exit()

    csvPath = os.path.join(workPath, '_csv')
    # ディレクトリ内のファイル
    files = os.listdir(csvPath)
    
    for f in files:
        # テキストファイルを探す
        if f[0] != '.' and f[-4:] == '.txt':
            fname = f[:-4]
            number = fname[-4:]
            
            found = False
            for x in dateFileList:
                if x[1] == number:
                    found = True
            # 変換済みでなければ    
            if not found:
                path = os.path.join(csvPath, fname +'.txt')
                fin = open(path, 'r')

                path = os.path.join(csvPath, fname +'.csv')
                fout = open(path, 'w')
                
                fout.write("City,School,Address,Type,Start,End,Grade,Count\n")
    
                mainProcess(fin, fout, annualData)
        
                fout.close()
                fin.close()

                # DateFileList.csvを更新
                dt = datetime.now()
                dateFileList.insert(0, [dt.strftime("%Y/%m/%d"),number])
                dateFileList.insert(0, ['Date','File'])
                
                fp = open(dflPath,'wb')
                writer = csv.writer(fp)
                for row in dateFileList:
                    writer.writerow(row)
                fp.close()
                break

