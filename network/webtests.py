from selenium import webdriver
import pathlib
import os

from .models import *

def file_uri(filename):
    return pathlib.Path(os.path.abspath(filename)).as_uri()
